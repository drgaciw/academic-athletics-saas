# Setup Guide - GitHub Template Repository

This guide shows how to create and publish your Turborepo Claude Code Template repository on GitHub.

## 🎯 What is a Template Repository?

A GitHub template repository allows others to create new repositories with the same directory structure and files. Perfect for sharing reusable Claude Code agents!

## 🚀 Setup

### Step 1: Create GitHub Repository

```bash
# Navigate to template directory
cd /path/to/.claude-exports/template-repo

# Initialize git
git init
git add .
git commit -m "Initial commit: Claude Code agents template"

# Create repository on GitHub
gh repo create your-org/turborepo-claude-template \
  --public \
  --description "Claude Code agents and skills for Turborepo development" \
  --source=.

# Push
git push -u origin main
```

### Step 2: Enable Template Feature

#### Via GitHub Website:

1. Go to your repository on GitHub
2. Click **Settings**
3. Scroll to **Template repository** section
4. Check ✅ **Template repository**
5. Save changes

#### Via GitHub CLI:

```bash
gh repo edit your-org/turborepo-claude-template \
  --enable-template
```

### Step 3: Add Topics

Help users discover your template:

```bash
gh repo edit your-org/turborepo-claude-template \
  --add-topic turborepo \
  --add-topic nextjs \
  --add-topic shadcn \
  --add-topic claude-code \
  --add-topic ai-agents \
  --add-topic monorepo \
  --add-topic template
```

Or via website:
1. Repository → About (gear icon)
2. Add topics: `turborepo`, `nextjs`, `shadcn`, `claude-code`, `ai-agents`

## 📝 Customize

### Update README

Rename `TEMPLATE_README.md` to `README.md`:

```bash
mv TEMPLATE_README.md README.md
git add README.md
git commit -m "Update README"
git push
```

### Add Description

Edit the "About" section on GitHub:
- **Description:** "Claude Code agents and skills for Turborepo + Next.js + Shadcn development"
- **Website:** Your documentation URL (optional)
- **Topics:** turborepo, nextjs, shadcn, claude-code, ai-agents

### Create Releases

Tag versions for users to reference specific versions:

```bash
git tag v1.0.0
git push --tags

# Create release on GitHub
gh release create v1.0.0 \
  --title "v1.0.0 - Initial Release" \
  --notes "Initial set of Claude Code agents and skills for Turborepo development"
```

## 🎨 Optional Enhancements

### Add .github/ Directory

Create `.github/README.md` for repository homepage:

```markdown
# Turborepo Claude Code Template

[Your marketing content here]

## Quick Start

Click "Use this template" to create a new repository with these agents!
```

### Add GitHub Action for Testing

`.github/workflows/test.yml`:

```yaml
name: Test Template

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Verify structure
        run: |
          test -d agents
          test -d skills
          test -f QUICK_REFERENCE.md
          test -f AGENTS_AND_SKILLS.md
          echo "✅ Template structure is valid"
```

### Add LICENSE

```bash
# Add MIT license
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

git add LICENSE
git commit -m "Add MIT license"
git push
```

### Add CONTRIBUTING.md

Help users contribute improvements:

```markdown
# Contributing

We welcome contributions!

## How to Contribute

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Adding New Agents

- Follow existing agent structure
- Include clear examples
- Update AGENTS_AND_SKILLS.md
- Add to QUICK_REFERENCE.md

## Reporting Issues

- Use GitHub Issues
- Include clear reproduction steps
- Suggest improvements
```

## 📊 Promote Your Template

### README Badges

Add badges to README:

```markdown
![GitHub stars](https://img.shields.io/github/stars/your-org/turborepo-claude-template)
![GitHub forks](https://img.shields.io/github/forks/your-org/turborepo-claude-template)
![License](https://img.shields.io/github/license/your-org/turborepo-claude-template)
```

### Social Preview

1. Repository Settings → Social preview
2. Upload a preview image (1280x640px recommended)

### Share

- Post on Twitter/X
- Share on Reddit (r/nextjs, r/webdev)
- Submit to awesome-lists
- Blog about it

## 🔄 Updating the Template

When you update agents or skills:

```bash
# Make changes
vim agents/turborepo-architect.md

# Commit
git add .
git commit -m "Update Turborepo Architect agent"
git push

# Create new release
git tag v1.1.0
git push --tags

gh release create v1.1.0 \
  --title "v1.1.0 - Updated Agents" \
  --notes "- Updated Turborepo Architect with new optimization tips"
```

Users can then:
- Pull latest changes if they cloned
- Re-download template for new projects
- See changelog in releases

## 📖 How Users Will Use It

### Via GitHub Template Feature

1. Click "Use this template" button
2. Create new repository
3. Clone and start using

### Via Direct Clone

```bash
cd my-turborepo-project
git clone https://github.com/your-org/turborepo-claude-template.git .claude
rm -rf .claude/.git
```

### Via Download

1. Download ZIP from GitHub
2. Extract to project's `.claude/` directory

## 🆘 Troubleshooting

### Template Option Not Showing

- Make sure you enabled "Template repository" in Settings
- Wait a few minutes for GitHub to update

### Users Can't Clone

- Check repository is public
- Verify permissions are set correctly

### Updates Not Appearing

- Ensure you pushed to `main` branch
- Clear browser cache

## 🔗 Resources

- [GitHub Template Repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository)
- [GitHub CLI Docs](https://cli.github.com/manual/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Your template is ready! 🎉**

Users can now easily add Claude Code agents to their Turborepo projects!
