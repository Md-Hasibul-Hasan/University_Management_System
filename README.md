# University Management System - Setup Guide

## ১. Fork Repository

প্রথমে প্রজেক্ট এর জন্য একটা ফোল্ডার বানাও এবং নিচের রিপোজিটরিতে যাও:

**https://github.com/Md-Hasibul-Hasan/University_Management_System**

উপরে ডান পাশে **Fork** বাটনে ক্লিক করে রিপোজিটরিটি নিজের GitHub অ্যাকাউন্টে কপি করে নাও।

---

## ২. Clone Repository

তোমার Fork করা রিপোজিটরির URL কপি করে টার্মিনালে রান করো।

```bash
git clone https://github.com/<your-github-username>/University_Management_System.git
```

Example:

```bash
git clone https://github.com/john/University_Management_System.git
```

---

## ৩. Project Folder এ যাও

```bash
cd University_Management_System
```

---

## ৪. Original Repository কে Upstream হিসেবে Add করো

```bash
git remote add upstream https://github.com/Md-Hasibul-Hasan/University_Management_System.git
```

Check করতে:

```bash
git remote -v
```

Output এরকম হবে:

```text
origin    https://github.com/<your-username>/University_Management_System.git
upstream  https://github.com/Md-Hasibul-Hasan/University_Management_System.git
```

---


## ৫. Server Run করো

Project-এর Backend ফোল্ডারে যাও:

```bash
cd Backend
```

Server চালাও:

```bash
uv run python manage.py runserver
```

API চলবে:

```
http://127.0.0.1:8000/
```

Google Crome এ যাও 

API Documentation দেখার জন্য ``` http://127.0.0.1:8000/api/redoc/ ```

API Test করার জন্য ``` http://127.0.0.1:8000/api/swagger/ ```

Admin Panel এ লগইন করার জন্য ``` http://127.0.0.1:8000/admin/ ```
```
Email : admin@gmail.com
Password : admin 
```


# প্রতিদিন কাজ শুরুর আগে

আমার latest code নেওয়ার জন্য:

```bash
git pull upstream main
```

যদি conflict না থাকে তাহলে code update হয়ে যাবে।

---


---

# নিজের পরিবর্তন Push করা (যদি কোনো পরিবর্তন করো)

```bash
git add .
git commit -m "Describe your changes"
git push origin main
```

---

# Pull Request

GitHub এ গিয়ে:

**Contribute → Open Pull Request**

PR create করে আমাকে পাঠাবে।

আমি review করে merge করে দেব।