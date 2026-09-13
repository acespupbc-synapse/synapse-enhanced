Whole system:

* Our app is currently swapping views with internal state instead of URL routes, so refreshing any page resets back to the home screen. Please implement React Router across the entire app so every single page has a dedicated URL path, and refreshing keeps the user right where they are.





Login:

It shouldn't prefill the username field.

when entering wrong password, Just show incorrect credentials message, because currently it's showing the old message that has hint for admin/admin as username and password



Dashboard:





1. Academic Year is also not consistent with the one on the settings, i mean, most of the settings are not fully functioning. Also, the starting default of the academic year should be 2026-2027, no more other date.
2. Datas require page refresh to update, which it shouldn't. 
3. Database Capacity is also working now, but it should display like 0.02% and not just whole number, and doesn't correctly display the MB, it still shows the dummy data (4.5MB of 500MB)
4. The CPU and API Health are also still using dummy data.
5. Registration status should just be displayed as a status and not look like a toggleable pill.
6. Live feed is working, but whenever i edit and save, it doesn't reflect.
7. recycle Bin stats are also not updating or sometimes late update.





Registrations:

1. On Registrations / ACES - BSCpE, it should have a button for exporting as mdb, pdf, and xlsx per section. 



Settings:

1. Database and engine: make sure every fields are not dummy data

2\. The "Download Complete Archive" still uses the mock data, it's not working as intended









