# ♟️ Chess Daily Trainer (تمرین روزانه شطرنج)

A modern, fluid, and responsive chess training web application built with **Next.js 15**, **chess.js**, and **react-chessboard**. Inspired by Chess.com's daily puzzles, featuring a sleek Apple-inspired UI design.

[Persian Description Below / توضیحات فارسی در پایین]

---

## ✨ Features

- **400+ Curated Puzzles:** Sourced from real games across three difficulty tiers.
- **Difficulty Tiers:** 
  - 🟢 **Beginner** (< 1300 rating)
  - 🟠 **Intermediate** (1300 - 2100 rating)
  - 🔴 **Advanced** (> 2100 rating)
- **Time Pressure:** Dynamic countdown timers based on difficulty (30s, 1m, 2m).
- **Daily Progress Tracking:** Track your solves, streaks, and best performance.
- **Apple-Style UI:** Fluid animations, glassmorphism (backdrop-blur), and responsive layout that fits the screen without scrolling.
- **Multilingual:** RTL support for Persian and LTR for technical chess notation.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/chess-daily-trainer.git
   cd chess-daily-trainer/chess-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate/Update puzzle data (optional):
   ```bash
   node scripts/generate-puzzles.mjs
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🇮🇷 توضیحات فارسی

این یک برنامه تحت وب مدرن برای تمرین روزانه شطرنج است که با استفاده از **Next.js 15** ساخته شده است. این برنامه شامل بیش از ۴۰۰ پازل شطرنج است که در سه سطح دشواری دسته‌بندی شده‌اند.

### ویژگی‌های کلیدی:
- **طراحی ریسپانسیو:** نمایش کامل در تمامی صفحات بدون نیاز به اسکرول.
- **سیستم تایمر هوشمند:** محدودیت زمانی متفاوت برای هر سطح (۳۰ ثانیه تا ۲ دقیقه).
- **ثبت پیشرفت:** ذخیره زنجیره (Streak) و رکوردهای شما در حافظه مرورگر.
- **رابط کاربری جذاب:** الهام گرفته از استانداردهای طراحی اپل با استفاده از افکت‌های شیشه‌ای و انیمیشن‌های نرم.

---

## 🛠️ Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Logic:** chess.js
- **UI Components:** react-chessboard (v5)
- **Styling:** Tailwind CSS 4
- **Persistence:** LocalStorage

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

---
Created with ❤️ by Alimi
