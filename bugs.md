1. on /register, when clicking the exit button, it should redirect to /home, not the admin panel (when signed in). (FIXED)
2. fix the layout of the footer on the home page (FIXED)
3. update the ACES SYNAPSE text on the home page, instead of text, use the png of the aces synapse i have on C:\dev_projects\aces-synapse-enhanced\frontend\public\img\logo\aces_synapse_text_register.png (FIXED)
4. remove the glow on the synapse logo on the homepage (FIXED)
5. Update the footer, instead of v2.1.2, place Enhanced. Remove the word "and" between the linkedin and github icon (FIXED)
6. on /dashboard, the registration pill should not be toggleable, it should just display the status if open or closed (FIXED - Replaced toggle switch with non-interactive solid outline badge matching the "Enhanced" footer badge with green for OPEN and red for CLOSED)
7. I noticed that the "ACES - BSCpE" part on "Registrations / ACES - BSCpE" doesn't use the same font as Registrations, fix it. (FIXED - Matched font weight 700 and letter-spacing with breadcrumb header link)
8. The registrations tab is not displaying the stats per program instantly, it is lagging. (FIXED)
9. Settings:Portal and Session: change "Add Future Academic Year" to "Add Academic Year". (FIXED)
10. Academic Programs tab, rename it to just "Programs". (FIXED)
11. Programs, the sections should be displayed as badges like it should be displayed as 1-1,2-1,2-2. and to add a new section, it should be another button similar to the Add Program button in which it will pop out a new modal and the field should be: Program(dropdown of available programs), Year Level(dropdown of 1st, 2nd, 3rd, 4th), and Name(example: 1-2, 1-1). Also, clicking any section badge opens an Edit Section modal (Course, Year Level, Section Name, Delete, Cancel, Save Changes) matching ACES Synapse styling, and Edit Program modal only contains Organization, Program Code, and Program Name. (FIXED)

12. On /register, update the navbar to use the aces synapse banner instead of the puplogo and ACES Synapse text. (FIXED)
13. On /register, update all the placeholder/helper details on the input fields to use generic examples, because right now it uses my name lmao. Also don't preset it to ACES/BSCpE and 1-1/1-2, just clean slate when newly opened. (FIXED)
14. On /register, change the color of the footer to match the footer on /dashboard. (FIXED)
15. On /dashboard, I just realized that the database capacity is only showing the Supabase, create another card below it that shows the Cloudflare capacity. (FIXED - Two distinct cards explicitly labeled "Supabase Storage Capacity" and "Cloudflare R2 Storage Capacity" with live MB / file calculations)
16. Live Users Count is not working/showing accurate (FIXED - Added global visitor session heartbeat tracking with accurate active viewer count)
17. On the Chat on Facebook button during the closed registration page, it should redirect to https://www.facebook.com/acespupbc (FIXED)


Exporting Problems/Bugs:
1. Remove the Export PDF Feature (FIXED)
2. When exporting a section on Registrations / ACES - BSCpE, The MS Access MDB function is not working. Also please just use these terms as export option: Export as CSV, Export as MDB. Also I noticed that there's a button next to the export button, which does nothing, remove that. (FIXED - Implemented section MDB generation endpoint, standardized export dropdown labels to "Export as CSV" and "Export as MDB", and removed the extra button)
3. The Download Archive doesnt include any .mdb files. It should have .csv and .mdb files. Also the folder structure I gave you whenever it exports is not implemented (FIXED - Archive ZIP now packages per-section {AcademicYear}/{Program}/{Section}/ folders with matching .csv, .mdb, PICTURES/, and SIGNATURES/, plus root master database files)
4. When exporting a CSV, the file naming should be Academic Year_Program_Section.csv (example: 2025-2026_BSCpE_1-1.csv) (FIXED - Pattern standardized across frontend and backend)

QoL:
1. On /register, typing the student numberr should prefill the "-" on the 0000-00000-BN-0 mask, so that students will just smoothly type the numbers instead of also typing the "-" (FIXED)
2. Add a skeletal loading for everything on the dashboard. It is currently loading instantly. (FIXED - Implemented full 1:1 BentoGrid skeleton shimmer placeholder on initial dashboard load)
3. On the admin panel, when clicking the tabs on the sidebar, there should be a loading state indicating that the page is loading. (FIXED - Added top crimson navigation progress bar and sidebar tab navigating spinner states during route transitions)
4. On /register, make sure to only allow numerical inputs on the Contact Phone Number field(also rename this to Contact Person's Phone Number) (FIXED)
5. On /register, make sure to validate gmail on the email field. (FIXED)
6. On /register, force Capitalize every input (FIXED)


Editing a record problem: (This only happens when we edit using the View/Edit button on the Live Registration Feed, The edit function works if we edit in the Registrations tab)
- When cropping a photo, if i click the Apply Crop button, it doesnt save it, in fact it doesnt do anything after i click the button. But If I do:
1. Retake Photo
2. Then crop
3. Success
- But after i press the save changes button, it doesnt save it
(FIXED - Added /api/admin/media-proxy to prevent canvas taint on remote R2 images in CropperModal, added student_number, course_code, section_name and flexible birthdate mapping in backend update endpoint, and properly awaited studentApi.update() on Save Changes)

Must do: verify if the Live Registration Feed Edit button is in sync with other edit modals. (VERIFIED - Both use the identical EditStudentModal component with synchronous database saves)


idk if this is a bug but, the dashboard is updating live, which is good, but when i press f5 or refresh the page, the dashboard datas take time to sync, explain that. If you can fix it much better. (FIXED)
The lag in updating dashboard datas sometimes is taking like upto 3-4 seconds. (FIXED - Consolidated student, recycle bin, photo and signature counts into a single SQL query, cached pg_database_size for 300s, and added a 2-second in-memory dashboard cache)