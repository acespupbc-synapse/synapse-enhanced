# Legacy Schema

## Tables and relationships
- **Organization**: `id`, `code`, `name`, `color_primary`, `color_gradient`, `logo_filename`, `header_bg_filename`
- **Course**: `id`, `org_id` (FK to Organization), `code`, `name`
- **Section**: `id`, `course_id` (FK to Course), `year_level`, `name`
- **Student**: `id`, `first_name`, `middle_name`, `last_name`, `student_number` (unique), `academic_year`, `organization`, `course`, `year_level`, `section`, `birthdate`, `email`, `residential_address`, `emergency_contact_name`, `emergency_address`, `emergency_contact_number`, `validity_status` (default: 'Pending'), `photo_filename`, `barcode_filename`, `created_at`
- **Admin**: `id`, `username`, `password_hash`
- **ChangeRequest**: `id`, `student_id` (FK to Student), `field_to_change`, `new_value`, `status`, `request_date` (Not actively used based on comments).

## Key Characteristics
- SQLite database.
- `Student` table relies heavily on string fields (`organization`, `course`, `year_level`, `section`) rather than foreign keys to the config tables, meaning denormalized storage for students.
- **Photo Storage**: Filenames are stored as strings (e.g., `uploads/photos/.../Last_First_Num.ext`).
- **Address Fields**: Personal residential address and emergency contact address are distinct fields (`residential_address` vs `emergency_address`).
- **Soft Delete**: Hard deletes are used (`db.session.delete()`). No soft-delete or trash implementation exists.
- **Registration Status**: `validity_status` exists on `Student`, defaulting to 'Pending'.
