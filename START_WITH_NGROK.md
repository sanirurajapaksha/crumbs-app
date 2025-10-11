# 🌐 Setting Up Expo with ngrok Tunnel

The built-in Expo ngrok tunnel is timing out. Here are solutions:

---

## ✅ Quick Solution: Use LAN Mode (Already Working!)

Your app is accessible at: `exp://172.28.30.245:8081`

```powershell
npx expo start --lan
```

**Pros:**
- ✅ Works immediately
- ✅ Fast and reliable
- ✅ No additional setup

**Cons:**
- ❌ Only works on same WiFi network
- ❌ Can't share with others remotely

---

## 🔧 Advanced Solution: Manual ngrok Setup

### Step 1: Install ngrok

**Option A: Using Chocolatey (Recommended)**
```powershell
choco install ngrok
```

**Option B: Manual Download**
1. Go to https://ngrok.com/download
2. Download Windows version
3. Extract to a folder (e.g., `C:\ngrok`)
4. Add to PATH

### Step 2: Sign up for ngrok (Free)
1. Go to https://dashboard.ngrok.com/signup
2. Create free account
3. Get your auth token

### Step 3: Configure ngrok
```powershell
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 4: Start Expo Normally
```powershell
npx expo start
```

### Step 5: In Another Terminal, Start ngrok
```powershell
ngrok http 8081
```

This will give you a public URL like: `https://abc123.ngrok.io`

### Step 6: Use the ngrok URL
Update your Expo app to use the ngrok URL instead of localhost.

---

## 🚀 Alternative: Expo Tunnel with Retry

Sometimes the tunnel just needs more time:

```powershell
# Try multiple times
npx expo start --tunnel

# If it fails, try again
npx expo start --tunnel

# Or wait 30 seconds and retry
```

---

## 📱 Using Cloudflare Tunnel (Free Alternative)

### Step 1: Install Cloudflare Tunnel
```powershell
winget install Cloudflare.cloudflared
```

### Step 2: Start Expo
```powershell
npx expo start
```

### Step 3: Start Cloudflare Tunnel
```powershell
cloudflared tunnel --url http://localhost:8081
```

This gives you a `*.trycloudflare.com` URL for free!

---

## 🎯 Recommendation

**For local development:** Use LAN mode (already working)
```powershell
npx expo start --lan
```

**For remote testing/sharing:** Use Cloudflare Tunnel (easier than ngrok)
```powershell
# Terminal 1:
npx expo start

# Terminal 2:
cloudflared tunnel --url http://localhost:8081
```

---

## 🐛 Why Expo's Built-in Tunnel Fails

Common reasons:
1. **Network restrictions** - Firewall/proxy blocking ngrok
2. **Slow connection** - Tunnel takes too long to establish
3. **ngrok rate limits** - Free tier limitations
4. **Port conflicts** - Another process using required ports

---

## ✨ Currently Running

Your Expo server is accessible via LAN at:
- **Metro:** `exp://172.28.30.245:8081`
- **Web:** `http://localhost:8081`

Scan the QR code with Expo Go app to test on your phone (same WiFi network required).

---

**Choose the solution that fits your needs!** 🚀
