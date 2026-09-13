1. The homepage should not be in /login, it should be /home
2. /login should be the one when user clicked the admin login button on /home
3. Database capacity percentage calculation is incorrect (shows 0.40% instead of 2.10% for 10.52 MB / 500 MB). Fix the formula to (used / total) * 100.
4. The MDB export section is not what i said, remove that. That's disastrous
5. The Download complete archive button on the settings panel is still not functioning, it still downloads a json file.
6. Changing Academic Year should display a warning prompt.
7. Academic Year option of 2024-2025, 2025-2026 is still existing, remove it. The academic year should start at 2026-2027 and let the admin add the future academic year.
8. The Dashboard is not updating in real time, it has lags, fix that. find the most optimized solution to this.
9. The signature data is missing. It's also not saved in the cloudflare.
10. For cloudflare saving the picture, every picture saved should have a file name of Surname, First Name Middle Initial_Picture.png. And for the signature it should be Surname, First Name Middle Initial_Signature.png