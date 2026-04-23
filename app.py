from flask import Flask, render_template, request, redirect
import sqlite3

app = Flask(__name__)

# 1. Database Setup (Memory)
def init_db():
    conn = sqlite3.connect('market.db')
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS crops 
                      (id INTEGER PRIMARY KEY, name TEXT, price TEXT, farmer TEXT)''')
    conn.commit()
    conn.close()
# 2. The Login Route (NEW - Paste this here)
@app.route('/login')
def login():
    return render_template('login.html')

# 3. The Home Route (Marketplace)
@app.route('/')
def index():
    conn = sqlite3.connect('market.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM crops")
    all_crops = cursor.fetchall()
    conn.close()
    return render_template('index.html', crops=all_crops)



# 4. The Add Crop Logic
@app.route('/add_crop', methods=['POST'])
def add_crop():
    # 1. Get the data from the form (Make sure your HTML input has name="phone")
    name = request.form.get('crop_name')
    price = request.form.get('price')
    phone = request.form.get('phone') 
    farmer = " Farmer" # You can also get this from request.form.get('farmer_name')

    # 2. Connect and Save
    conn = sqlite3.connect('market.db')
    cursor = conn.cursor()
    
    # Update this line to include the phone column
    cursor.execute("INSERT INTO crops (name, price, farmer, farmer_phone) VALUES (?, ?, ?, ?)", 
                   (name, price, farmer, phone))
    
    conn.commit() # This saves it permanently
    conn.close()
    return redirect('/')

if __name__ == "__main__":
    init_db()
    app.run(debug=True)