import { Inngest } from "inngest";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import sendEmail from "../config/nodemailer.js";

/* =========================
   INNGEST CLIENT
========================= */
export const inngest = new Inngest({
  id: "mernstackems",
});

/* =========================
   AUTO CHECKOUT FUNCTION
========================= */
const autoCheckOut = inngest.createFunction(
  {
    id: "auto-check-out",
    triggers: [{ event: "employee/check-out" }],
  },
  async ({ event, step }) => {
    const { employeeId, attendanceId } = event.data;

    await step.sleep("wait-9-hours", "9h");

    let attendance = await Attendance.findById(attendanceId);
    if (!attendance || attendance.checkOut) return;

    const employee = await Employee.findById(employeeId);
    if (!employee) return;

    await sendEmail({
      to: employee.email,
      subject: "Attendance Check-Out Reminder",
      body: `
        <div style="max-width:600px;font-family:Arial;">
          <h2>Hi ${employee.firstName}</h2>

          <p>You checked in for <b>${employee.department}</b>.</p>

          <p style="font-weight:bold;color:#007bff;">
            ${attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString() : ""}
          </p>

          <p>Please make sure to check out.</p>
        </div>
      `,
    });

    await step.sleep("wait-1-hour", "1h");

    attendance = await Attendance.findById(attendanceId);
    if (!attendance || attendance.checkOut) return;

    attendance.checkOut =
      new Date(attendance.checkIn).getTime() + 4 * 60 * 60 * 1000;

    attendance.workingHours = 4;
    attendance.dayType = "Half Day";
    attendance.status = "LATE";

    await attendance.save();
  },
);

/* =========================
   LEAVE REMINDER FUNCTION
========================= */
const leaveApplicationReminder = inngest.createFunction(
  {
    id: "leave-application-reminder",
    triggers: [{ event: "leave/pending" }],
  },
  async ({ event, step }) => {
    const { leaveApplicationId } = event.data;

    await step.sleep("wait-24-hours", "24h");

    const leaveApplication =
      await LeaveApplication.findById(leaveApplicationId);

    if (!leaveApplication || leaveApplication.status !== "PENDING") return;

    const employee = await Employee.findById(leaveApplication.employeeId);
    if (!employee) return;

    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: "Leave Application Reminder",
      body: `
        <div style="max-width:600px;font-family:Arial;">
          <h2>Hi Admin</h2>

          <p>
            Leave request pending from <b>${employee.firstName}</b>.
          </p>

          <p>Department: ${employee.department}</p>

          <p>Please take action soon.</p>
        </div>
      `,
    });
  },
);

/* =========================
   DAILY ATTENDANCE CRON
========================= */
const attendanceReminderCron = inngest.createFunction(
  {
    id: "attendance-reminder-cron",
    triggers: [{ cron: "30 11 * * *" }],
  },
  async ({ step }) => {
    const today = await step.run("today-range", () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      return { start, end };
    });

    const activeEmployees = await step.run("active-employees", async () => {
      const employees = await Employee.find({
        isDeleted: false,
        employmentStatus: "ACTIVE",
      }).lean();

      return employees.map((e) => ({
        _id: e._id.toString(),
        firstName: e.firstName,
        email: e.email,
        department: e.department,
      }));
    });

    const onLeaveIds = await step.run("on-leave", async () => {
      const leaves = await LeaveApplication.find({
        status: "APPROVED",
        startDate: { $lte: today.end },
        endDate: { $gte: today.start },
      }).lean();

      return leaves.map((l) => l.employeeId.toString());
    });

    const checkedInIds = await step.run("checked-in", async () => {
      const attendances = await Attendance.find({
        date: { $gte: today.start, $lte: today.end },
      }).lean();

      return attendances.map((a) => a.employeeId.toString());
    });

    const absentEmployees = activeEmployees.filter(
      (emp) => !onLeaveIds.includes(emp._id) && !checkedInIds.includes(emp._id),
    );

    if (absentEmployees.length > 0) {
      await step.run("send-emails", async () => {
        await Promise.all(
          absentEmployees.map((emp) =>
            sendEmail({
              to: emp.email,
              subject: "Attendance Reminder",
              body: `
                <div style="max-width:600px;font-family:Arial;">
                  <h2>Hi ${emp.firstName}</h2>

                  <p>You have not marked attendance today.</p>

                  <p>Please check in immediately.</p>

                  <p>Department: ${emp.department}</p>
                </div>
              `,
            }),
          ),
        );
      });
    }

    return {
      totalActive: activeEmployees.length,
      onLeave: onLeaveIds.length,
      checkedIn: checkedInIds.length,
      absent: absentEmployees.length,
    };
  },
);

/* =========================
   EXPORT
========================= */
export const functions = [
  autoCheckOut,
  leaveApplicationReminder,
  attendanceReminderCron,
];
