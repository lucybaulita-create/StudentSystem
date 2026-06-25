# Jenkins Setup Guide for StudentSystem

## Initial Setup

### 1. Access Jenkins
- Open http://localhost:8080
- Retrieve the initial admin password from:
  - Windows: `C:\ProgramData\Jenkins\.jenkins\secrets\initialAdminPassword`
  - Or check Jenkins logs during startup
- Complete the setup wizard and create an admin account

### 2. Install Required Plugins
Go to **Manage Jenkins → Manage Plugins → Available**:

Search for and install:
- ✓ GitHub Integration
- ✓ Docker Pipeline
- ✓ Pipeline
- ✓ Blue Ocean (optional but recommended)
- ✓ Git
- ✓ SSH Agent (if needed)

After installation, restart Jenkins.

---

## Create Pipeline Job

### Step 1: Create New Job
1. Click **New Item**
2. Enter Job Name: `StudentSystem-Pipeline`
3. Select **Pipeline**
4. Click **OK**

### Step 2: Configure Pipeline
1. Under **Pipeline** section:
   - Definition: Select **Pipeline script from SCM**
   - SCM: Select **Git**
   - Repository URL: `https://github.com/YOUR_USERNAME/StudentSystem.git`
   - Credentials: Add GitHub credentials if private repo
   - Branch: `*/main` (or your default branch)
   - Script Path: `Jenkinsfile` (should auto-fill)

2. Click **Save**

---

## GitHub Webhook Setup

### Option A: Automatic (Recommended)
1. Install **GitHub Integration** plugin (already done above)
2. In your GitHub repo settings:
   - Go to **Settings → Webhooks**
   - Click **Add webhook**
   - **Payload URL**: `http://YOUR_JENKINS_URL/github-webhook/`
   - **Content type**: `application/json`
   - **Events**: Select "Push events" and "Pull requests"
   - **Active**: Check the box
   - Click **Add webhook**

### Option B: Manual
If webhook needs configuration:
1. In Jenkins job, go to **Configure**
2. Under **Build Triggers**, check:
   - **GitHub hook trigger for GITScm polling**
3. Save
4. Test: Push to GitHub → Jenkins should trigger automatically

---

## Local Webhook Testing (If Behind Firewall)

If your machine is behind a firewall and GitHub can't reach Jenkins:

### Use ngrok for Tunneling:
```bash
# Install ngrok from ngrok.com
# Run in terminal:
ngrok http 8080

# You'll get a URL like: https://xxxx-xx-xxx-xx-x.ngrok.io
# Use this as: https://xxxx-xx-xxx-xx-x.ngrok.io/github-webhook/
```

---

## Environment Variables (Optional)

Add to Jenkins job for flexibility:

1. Go to **Configure** → **Pipeline** → **Advanced**
2. Add parameters:
   - `DOCKER_REGISTRY`: Docker Hub username
   - `DEPLOYMENT_ENV`: dev/staging/prod
   - `SLACK_WEBHOOK`: For notifications

---

## Triggering Builds Manually

### Option 1: Jenkins UI
- Open job in Jenkins
- Click **Build Now**

### Option 2: CLI
```bash
curl -X POST http://localhost:8080/job/StudentSystem-Pipeline/build --user admin:YOUR_TOKEN
```

To get API token:
1. Jenkins → Click your profile (top right)
2. Click **Configure**
3. Under **API Token**, click **Generate**
4. Copy and use the token

---

## Troubleshooting

### Issue: Build can't find Docker
**Solution**: 
```bash
# On Windows, ensure Docker daemon is running
# Add Jenkins user to docker group (on Linux):
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Issue: npm/pip commands not found
**Solution**: Jenkins may need Python/Node paths
1. Go to **Manage Jenkins → Configure System**
2. Under **Global properties**, add:
   - `PATH`: Include paths to Python and Node installations

### Issue: Docker socket permission denied
**Solution**:
```bash
# Run Jenkins with Docker access (Windows):
# Run Jenkins service with appropriate permissions
```

### Issue: Webhook not triggering
**Solution**:
1. Check GitHub webhook delivery: Repo → Settings → Webhooks → Check "Recent Deliveries"
2. Verify Jenkins URL is accessible
3. Check Jenkins logs: Look for webhook requests

---

## Test the Pipeline

1. Make a small change to your repo
2. Push to GitHub
3. Check Jenkins:
   - Job should auto-trigger
   - Monitor build progress in Blue Ocean or classic view
   - Check console output for errors

---

## Next Steps

- [ ] Install plugins
- [ ] Create GitHub webhook
- [ ] Test by pushing code
- [ ] Monitor logs and debug any issues
- [ ] Configure email/Slack notifications (optional)
- [ ] Set up deployment environments (staging/production)

