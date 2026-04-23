# 🌾 Farmer Direct Market — Setup Guide

## Files in this project
```
farmer-direct-market/
├── index.html   ← Main HTML (pages, navbar, modal, hero)
├── style.css    ← All styles (responsive, animations, themes)
└── script.js    ← Firebase logic, language switch, filtering
```

---

## 🚀 Quick Start (Demo Mode)

**No Firebase needed to see the full UI!**

1. Open `index.html` in any browser (double-click it)
2. The app runs with 6 demo products automatically
3. You'll see a green banner at the bottom saying "Demo Mode"

---

## 🔥 Firebase Setup (Live Database)

Follow these steps to enable real data storage:

### Step 1 — Create a Firebase Project
1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Name it (e.g. `farmer-direct-market`)
4. Disable Google Analytics (optional) → Click **Create Project**

### Step 2 — Create Firestore Database
1. In the left sidebar → **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select a region (e.g. `asia-south1` for India)
5. Click **Enable**

### Step 3 — Register a Web App
1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** → Click **</>** (Web)
3. Name the app (e.g. `farmer-market-web`) → Click **Register app**
4. Copy the `firebaseConfig` object shown

### Step 4 — Update script.js
Open `script.js` and replace the config block at the top:

```javascript
const firebaseConfig = {
  apiKey:            "YOUR_ACTUAL_API_KEY",
  authDomain:        "your-project-id.firebaseapp.com",
  projectId:         "your-project-id",
  storageBucket:     "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef123456"
};
```

### Step 5 — Done!
Reload `index.html` — the demo mode banner will disappear and all data will save to Firestore in real-time.

---

## 🌐 Features Explained

| Feature | How it works |
|---|---|
| **Add Product** | Click "Sell Product" → fill form → saved to Firestore |
| **Real-time updates** | Firestore `onSnapshot()` listener updates UI instantly |
| **Search** | Filters by product name as you type |
| **Location filter** | Dropdown auto-populates from listed locations |
| **Sort** | Newest first / Price low-high / Price high-low |
| **Language toggle** | Switches all UI text between English and Kannada |
| **Call button** | Opens phone dialer with farmer's number |
| **WhatsApp button** | Opens WhatsApp with pre-filled message to farmer |
| **Demo mode** | Auto-detected when Firebase config is not set |

---

## 📱 Responsive Breakpoints
- **Desktop** (>900px): 2-column hero, 3-column product grid
- **Tablet** (640–900px): Single column hero, 2-column grid
- **Mobile** (<640px): Full width, stacked layout

---

## 🔒 Security (Before Going Public)

Update Firestore rules to prevent abuse:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{product} {
      allow read: if true;
      allow write: if request.resource.data.keys().hasAll(['name','price','location','farmerName','phone'])
                   && request.resource.data.name is string
                   && request.resource.data.price is number;
    }
  }
}
```

---

## 🎨 Customization

**Change accent color** — edit in `style.css`:
```css
--green-deep:   #1a3d2b;   ← Dark green (headings, buttons)
--green-bright: #40916c;   ← Mid green (icons, accents)
--earth:        #8b5e3c;   ← Brown (price highlight)
--cream:        #fdf6ec;   ← Background
```

**Add more categories** — in `index.html` inside `.category-chips`:
```html
<button type="button" class="chip" data-value="Flowers" onclick="selectChip(this)">
  🌸 <span data-en="Flowers" data-kn="ಹೂವುಗಳು">Flowers</span>
</button>
```