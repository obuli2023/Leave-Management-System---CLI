# Employee Leave & Order Alert Management System Implementation Plan

This document outlines the proposed architecture and execution plan for the Employee Leave & Order Alert Management System based on the detailed requirements provided.

## User Review Required
> [!IMPORTANT]
> - Do you have a preferred React template setup (e.g., Vite with TypeScript)? I plan to use **React (Vite) with TypeScript and Tailwind CSS** for a modern, responsive design.
> - For the backend, I will use **.NET 8.0** (or whatever latest SDK is installed on your system) along with `MongoDB.Driver`.
> - The directory `d:\AntigravityProjects\Leave Management System - CLI` is currently empty. I will initialize two parallel folders inside it: `Backend` (for ASP.NET Core) and `Frontend` (for React). Please confirm this structure is acceptable.

## Proposed Changes

We will split the system architecture into a decoupled frontend and backend.

### Database Architecture (MongoDB)
Based on your schema design, we will create the following collections:
- `Employees`: Store user details, role (`Admin` or `Employee`), password hash.
- `Leaves`: Leave applications (`EmployeeId`, `LeaveDate`, `LeaveType`, `Status`, `IsPaidLeave`).
- `LeaveBalances`: Monthly tracking of paid leave limits per user.
- `Orders`: "Big Order Days" dates and messages.
- `Attendance`: Daily "Present" status tracking per employee.

### Backend (ASP.NET Core Web API)
- **Authentication**: JWT generation for valid users (sign-in via `email` and `passwordHash`).
- **Services & Rules Engine**:
  - **Leave Validation Rules**:
    - Reject `Casual Leave` on `Big Order Days`.
    - Ensure `Sick Leave` is applied only after the leave date.
    - Check if Leave is `Pending` before allowing edits or soft deletes.
  - **Paid/Unpaid Calculation**: Check the `LeaveBalances` collection upon approval. If `usedLeaves < 2`, it's marked as paid, otherwise unpaid.
- **Controllers**:
  - `AuthController`, `EmployeesController`, `LeavesController`, `OrdersController`, `AttendanceController` mapping to the designated routes.

### Frontend (React.js)
- **State Management**: React Context API to hold the logged-in user profile, JWT token, and role.
- **Routing**: `react-router-dom` to separate routes (e.g., `/admin/dashboard` vs. `/employee/dashboard`).
- **UI UX Strategy**:
  - **Tailwind CSS** for rapid styling, focusing on a clean and vibrant corporate aesthetic (suitable for a startup).
  - Use of standard library tables for lists (Employees, Leave History) and forms for data entry.
  - **Axios** to handle API requests and interceptors to automatically attach the JWT token to request headers.

## Verification Plan

### Automated Tests
- Once the backend is set up, I will write small, automated endpoint test commands using `curl` or PowerShell `Invoke-RestMethod` to verify basic CRUD operations and authentication.

### Manual Verification
- We will run both the Frontend and Backend servers locally.
- 1. Create an **Admin** user.
  2. Create an **Employee** user.
  3. Admin logs in and creates a `Big Order Day`.
  4. Employee logs in and attempts to apply for `Casual Leave` on the big order day (Expect: Validation failure).
  5. Employee applies for `Emergency Leave` on the big order day (Expect: Success, Pending Admin Approval).
  6. Admin logs in to approve the leave.
  7. Verify `LeaveBalances` update accordingly.
  8. Employee marks daily attendance and views it in the dashboard.
- Finally, I will provide a walkthrough document detailing how you can test the entire flow in your browser.
