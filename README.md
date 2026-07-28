# University Management System - Setup Guide


git pull origin main

Backend uv run python manage.py runserver

Frontend npm run dev

git add .

git commit -m "comment"

git push

## ১. Project Folder তৈরি করো

প্রথমে তোমার কম্পিউটারে প্রজেক্টের জন্য একটি ফোল্ডার তৈরি করো।

তারপর সেই ফোল্ডারে **VS Code** ওপেন করো।

### VS Code দিয়ে Folder Open করার উপায়

১. **VS Code** ওপেন করো।

২. উপরের মেনু থেকে:

```
File → Open Folder...
```

৩. যে ফোল্ডারটি তৈরি করেছ সেটি সিলেক্ট করে **Open** এ ক্লিক করো।

৪. VS Code-এর Terminal ওপেন করো।

```
Terminal → New Terminal
```


এখন নিচের সব Git Command এই Terminal থেকেই রান করবে।

---

## ২. Fork Repository

নিচের Link এ যাও:

**https://github.com/Md-Hasibul-Hasan/University_Management_System**

উপরে ডান পাশে **Fork** বাটনে ক্লিক করে রিপোজিটরিটি নিজের GitHub অ্যাকাউন্টে কপি করে নাও।

---

## ৩. Clone Repository

তোমার Fork করা রিপোজিটরির URL কপি করে Terminal-এ রান করো।

```bash
git clone https://github.com/<your-github-username>/University_Management_System.git
```

Example:

```bash
git clone https://github.com/john/University_Management_System.git
```

---

## ৪. Project Folder-এ যাও

```bash
cd University_Management_System
```

---

## ৫. Original Repository কে Upstream হিসেবে Add করো

```bash
git remote add upstream https://github.com/Md-Hasibul-Hasan/University_Management_System.git
```

Check করতে:

```bash
git remote -v
```

Output এরকম হবে:

```text
origin    https://github.com/<your-github-username>/University_Management_System.git
upstream  https://github.com/Md-Hasibul-Hasan/University_Management_System.git
```

---

## ৬. Backend Folder-এ যাও

```bash
cd Backend
```

---

## ৭. Server Run করো

```bash
uv run python manage.py runserver
```

API চলবে:

```text
http://127.0.0.1:8000/
```

---

## ৮. Browser থেকে API Test করো

### API Documentation (ReDoc)

```text
http://127.0.0.1:8000/api/redoc/
```

### API Testing (Swagger)

```text
http://127.0.0.1:8000/api/swagger/
```

### Django Admin Panel

```text
http://127.0.0.1:8000/admin/
```

Admin Credentials:

```text
Email    : admin@gmail.com
Password : admin
```

---

# প্রতিদিন কাজ শুরুর আগে

আমার latest code নেওয়ার জন্য:

```bash
git pull upstream main
```

যদি conflict না থাকে তাহলে code update হয়ে যাবে।

---

# নিজের পরিবর্তন Push করা (যদি কোনো পরিবর্তন করো)

```bash
git add .
git commit -m "Describe your changes"
git push origin main
```

---

# Pull Request

GitHub-এ গিয়ে:

**Contribute → Open Pull Request**

PR create করে আমাকে পাঠাবে।

আমি review করে merge করে দেব।

