#!/bin/bash

echo "=== Gemini CLI API Error - Quick Fix ==="
echo ""
echo "The error you're seeing is from the 'Gemini CLI' tool, NOT your project."
echo ""

# Check if gcloud is installed
if command -v gcloud &> /dev/null; then
    echo "✓ Google Cloud CLI (gcloud) is installed"
    
    # Check current project
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
    if [ "$CURRENT_PROJECT" = "(unset)" ] || [ "$CURRENT_PROJECT" = "default" ]; then
        echo "✗ No Google Cloud project is set (currently: $CURRENT_PROJECT)"
        echo ""
        echo "To fix this, run:"
        echo "  1. List your projects: gcloud projects list"
        echo "  2. Set a project: gcloud config set project YOUR_PROJECT_ID"
    else
        echo "✓ Current project: $CURRENT_PROJECT"
        
        # Check if API is enabled
        echo ""
        echo "Checking if Cloud AI Companion API is enabled..."
        if gcloud services list --enabled --filter="name:cloudaicompanion.googleapis.com" 2>/dev/null | grep -q "cloudaicompanion"; then
            echo "✓ Cloud AI Companion API is enabled"
        else
            echo "✗ Cloud AI Companion API is NOT enabled"
            echo ""
            echo "To enable it, run:"
            echo "  gcloud services enable cloudaicompanion.googleapis.com"
        fi
    fi
else
    echo "✗ Google Cloud CLI (gcloud) is not installed"
    echo ""
    echo "To install it:"
    echo "  https://cloud.google.com/sdk/docs/install"
fi

echo ""
echo "=== Alternative: Use Your Project's AI Services ==="
echo "Your Athletic Academics Hub project uses:"
echo "  • OpenAI (GPT-4)"
echo "  • Anthropic (Claude)"
echo ""
echo "You don't need Google Gemini CLI for your project."
echo ""
echo "See fix-gemini-api-error.md for detailed documentation."
