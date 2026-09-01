# 🎓 University Management System

A comprehensive full-stack application for managing university operations including student enrollment, course management, academic records, and administrative tasks. Built with modern technologies for scalability and user-friendly experience.

**Live Demo:** [https://universitymanagementsystem-two.vercel.app](https://universitymanagementsystem-two.vercel.app)

---

## ✨ Features

- **Student Management** - Register, track, and manage student records
- **Course Management** - Create and organize courses, schedules, and enrollment
- **Academic Records** - Track grades, transcripts, and academic progress
- **Admin Dashboard** - Comprehensive administrative interface with analytics
- **RESTful API** - Well-documented API endpoints with Swagger/ReDoc
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Updates** - Live data synchronization across the application

---

## 🛠️ Tech Stack

### Frontend (68.5%)
- **Next.js** (v16.2.11) - React framework for production
- **React** (v19.2.4) - UI library
- **Redux Toolkit** - State management
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Recharts** - Data visualization
- **React Hook Form** - Efficient form handling
- **Axios** - HTTP client for API requests

### Backend (30.6%)
- **Django** - Python web framework
- **Django REST Framework (DRF)** - Building RESTful APIs
- **Python** - Backend logic and business operations

### Tools & Infrastructure
- **Vercel** - Frontend hosting and deployment
- **Git** - Version control
- **VS Code** - Development environment

---

## 📦 Installation & Setup

### Prerequisites
- **Node.js** (v18+) and npm/yarn
- **Python** (v3.8+) and pip/uv
- **Git** installed on your system

### 1. Clone the Repository

```bash
git clone https://github.com/Md-Hasibul-Hasan/University_Management_System.git
cd University_Management_System
```

### 2. Set Up Backend (Django)

Navigate to the Backend folder:

```bash
cd Backend
```

Create a virtual environment:

```bash
# Using uv (recommended)
uv venv

# Or using venv
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:

```bash
uv pip install -r requirements.txt
# Or with pip
pip install -r requirements.txt
```

Run migrations:

```bash
uv run python manage.py migrate
```

Start the backend server:

```bash
uv run python manage.py runserver
```

The API will be available at: `http://127.0.0.1:8000/`

### 3. Set Up Frontend (Next.js)

In a new terminal, navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
# or
yarn install
```

Start the development server:

```bash
npm run dev
# or
yarn dev
```

The frontend will be available at: `http://localhost:3000`

---

## 📚 API Documentation

Once the backend is running, access the API documentation:

### Swagger UI (Interactive API Testing)
```
http://127.0.0.1:8000/api/swagger/
```

### ReDoc (Interactive API Documentation)
```
http://127.0.0.1:8000/api/redoc/
```

### Django Admin Panel
```
http://127.0.0.1:8000/admin/
```

**Default Admin Credentials:**
- Email: `admin@gmail.com`
- Password: `admin`

---

## 🚀 Deployment

### Frontend (Vercel)

The frontend is already deployed on Vercel. To deploy your own version:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically detect Next.js and configure deployment settings
4. Your app will be live at a provided URL

### Backend Deployment

You can deploy the Django backend to services like:
- **Heroku** - Simple deployment with Procfile
- **Railway** - Modern Python hosting
- **PythonAnywhere** - Specific to Python applications
- **DigitalOcean** - Virtual private server

---

## 📝 Project Structure

```
University_Management_System/
├── frontend/                  # Next.js frontend application
│   ├── app/                  # Next.js app directory
│   ├── components/           # Reusable React components
│   ├── lib/                  # Utility functions and helpers
│   ├── public/               # Static assets
│   └── package.json          # Frontend dependencies
│
├── Backend/                  # Django backend application
│   ├── manage.py             # Django management script
│   ├── db.sqlite3            # SQLite database
│   ├── requirements.txt       # Python dependencies
│   └── [apps]/               # Django apps
│
└── README.md                 # This file
```

---

## 🔄 Git Workflow (For Contributors)

### Fork & Clone

1. Fork the repository using the **Fork** button on GitHub
2. Clone your forked repository:

```bash
git clone https://github.com/<your-username>/University_Management_System.git
cd University_Management_System
```

### Add Upstream Remote

```bash
git remote add upstream https://github.com/Md-Hasibul-Hasan/University_Management_System.git
```

Verify remotes:
```bash
git remote -v
```

### Making Changes

Before starting work each day, sync with the main repository:

```bash
git pull upstream main
```

Create a new branch for your feature:

```bash
git checkout -b feature/your-feature-name
```

Commit your changes:

```bash
git add .
git commit -m "feat: describe your changes clearly"
git push origin feature/your-feature-name
```

### Create a Pull Request

1. Go to your forked repository on GitHub
2. Click **Contribute → Open Pull Request**
3. Add a descriptive title and detailed description
4. Submit your PR for review

---

## 💡 Usage Examples

### Starting Development

```bash
# Terminal 1: Start Backend
cd Backend
uv run python manage.py runserver

# Terminal 2: Start Frontend
cd frontend
npm run dev
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

**Backend:**
```bash
cd Backend
uv run python manage.py collectstatic
```

---

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Ensure Python dependencies are installed: `uv pip install -r requirements.txt`
- Check if port 8000 is available
- Try: `uv run python manage.py runserver 0.0.0.0:8001` (different port)

**Frontend won't start:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next && npm run dev`
- Ensure Node.js version is compatible (v18+)

**Database errors:**
- Run migrations: `uv run python manage.py migrate`
- Create superuser: `uv run python manage.py createsuperuser`

---

## 📧 Support & Questions

If you encounter any issues or have questions:

1. Check the existing issues on GitHub
2. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Your environment details (OS, Node version, Python version)
   - Screenshots if applicable

---

## 📄 License

This project is open source and available for educational purposes.

---

## 🙏 Contributing

Contributions are welcome! Please follow the Git Workflow section above. We appreciate:
- Bug reports and fixes
- Feature suggestions and implementations
- Documentation improvements
- Code optimizations

---

## 👤 Author

**Md Hasibul Hasan**  
GitHub: [@Md-Hasibul-Hasan](https://github.com/Md-Hasibul-Hasan)

---

## 📊 Project Stats

- **Repository:** [GitHub Link](https://github.com/Md-Hasibul-Hasan/University_Management_System)
- **Frontend Technology:** Next.js + React
- **Backend Technology:** Django + DRF
- **Status:** Active Development

---

*Last Updated: September 2026*
