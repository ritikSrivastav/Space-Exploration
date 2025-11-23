# 🌌 **Space Exploration Project – ISS Live Tracker**

Track the real-time location of the **International Space Station (ISS)** on an interactive map.
This project uses **Leaflet.js**, **OpenStreetMap**, and the **Open Notify API** to visualize live ISS data in a simple, lightweight, and stable interface.

---

## 🚀 **Features**

* 🛰 **Live ISS Position Tracking** (auto-refresh every few seconds)
* 🌍 **Interactive World Map** (Leaflet + OpenStreetMap tiles)
* 🔁 **Smooth ISS Icon Updates**
* 📡 **Real-time API Integration**
* 💻 **Clean, beginner-friendly code structure**
* ⚡ **Fast, lightweight, and stable version**
* 🔒 **Separated JS and CSS files for security and cleaner deployment**

---

## 🧩 **Tech Stack**

* **HTML5**
* **CSS3**
* **JavaScript (ES6+)**
* **Leaflet.js**
* **Open Notify API** (ISS position data)

---

## 📁 **Project Structure**

```
📦 space-exploration
 ┣ 📂 css
 ┃ ┗ 📄 style.css
 ┣ 📂 js
 ┃ ┗ 📄 script.js
 ┣ 📄 index.html
 ┗ 📄 README.md
```

---

## ⚙️ **How to Run This Project**

### **1. Clone the repository**

```
git clone https://github.com/<your-username>/<your-repo>.git
```

### **2. Navigate into the folder**

```
cd space-exploration
```

### **3. Open the project**

Open `index.html` in your browser
—or—
Use Live Server (VS Code)

---

## 🌍 **API Used**

**ISS Current Location API**
`https://api.open-notify.org/iss-now.json`
Provides:

* `latitude`
* `longitude`
* `timestamp`

---

## 🛰 **How the Live Tracking Works**

1. Fetches ISS latitude & longitude every few seconds
2. Updates the map marker’s position
3. Smoothly pans the map to follow the ISS
4. Displays real-time coordinates

The map auto-centers to give an uninterrupted live view.

---

## ✨ **Future Enhancements**

* Track ISS speed
* Display altitude + velocity
* Show astronaut data on board
* Add dark mode
* Show ISS path history (polyline trail)
* Notifications when ISS passes over your location

---

## 🙌 **Contributions**

Contributions, feature requests, and bug reports are welcome!
Create a pull request or open an issue.

---

## 📜 **License**

MIT License – Feel free to use and modify this project.

---

## 👨‍🚀 **Author**

**Ritik Srivastav**
---
