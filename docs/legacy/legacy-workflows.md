# Legacy Workflows

## Registration Workflow
- **Multi-step Flow**: 4-step wizard UI (Academic Information, Personal Details, Emergency Contact, Review Registration). 
- **Validation**:
  - Client-side checks before advancing steps (HTML5 `required`, email pattern matching).
  - Server-side checks for duplicate `student_number` (redirects with error).
- **Photo Capture/Upload**: File upload element. Handled in backend `save_student_photo` which constructs a deep directory tree: `static/uploads/photos/{AY}/{Org}/{Course}/{Year}/{Section}/Last_First_StudentNum.ext`. No camera capture logic was found in the legacy UI (only file upload).
- **Student ID Preview**: Live 3D flipping card that updates via JavaScript event listeners on form fields.
- **Submission**: Writes directly to DB upon final submit.
- **Closed Registration**: If `registration_closed.lock` file exists in app root, registration route returns `closed.html`.

## Administrative Workflow
- **Authentication**: Form-based login against `Admin` table (hashed passwords).
- **Security Check**: Basic string-matching WAF to block SQL injection keywords on login form.
- **Dashboard**: Shows student counts per course.
- **Course View**: Lists students grouped by year and section.
- **CRUD Operations**: 
  - Edit student details via form.
  - Delete single student or bulk delete array of IDs (hard delete).
- **Photo/Signature**: No signature management found. Photos can be re-uploaded on student edit.
- **System Settings**: Admin can add/edit/delete Organizations, Courses, and Sections. Toggle registration status (creates/removes lock file).
