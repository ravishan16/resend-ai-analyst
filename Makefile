# Enhanced Makefile for comprehensive testing and development

dev:
	@echo "🚀 Starting development server..."
	@wrangler dev

deploy:
	@echo "🚀 Deploying to Cloudflare Workers..."
	@wrangler deploy

# Individual component testing
test-finnhub:
	@echo "📊 Testing Finnhub earnings data..."
	@node -r dotenv/config src/cli.js finnhub

test-polygon:
	@echo "📈 Testing Polygon.io volatility data..."
	@node -r dotenv/config src/cli.js polygon

test-volatility:
	@echo "📊 Testing volatility analysis pipeline..."
	@node -r dotenv/config src/cli.js volatility

test-gemini:
	@echo "🤖 Testing Gemini AI analysis..."
	@node -r dotenv/config src/cli.js gemini

test-email:
	@echo "📧 Testing email template and delivery..."
	@node -r dotenv/config src/cli.js email

test-scoring:
	@echo "🎯 Testing opportunity scoring algorithm..."
	@node -r dotenv/config src/cli.js scoring

# Integration testing  
test-pipeline:
	@echo "🔄 Testing complete data pipeline..."
	@node -r dotenv/config src/cli.js pipeline

test-full-run:
	@echo "🎯 Simulating complete daily run..."
	@node -r dotenv/config src/cli.js full-run

# Preview and debugging
preview-email:
	@echo "👀 Previewing email template..."
	@node -r dotenv/config src/cli.js preview-email

debug-run:
	@echo "🔍 Running with debug output..."
	@DEBUG=1 node -r dotenv/config src/cli.js full-run

# Test specific stock
test-stock:
	@echo "📊 Testing analysis for $(SYMBOL)..."
	@SYMBOL=$(SYMBOL) node -r dotenv/config src/cli.js test-stock

# Production deployment helpers
verify-deployment:
	@echo "✅ Verifying production deployment..."
	@curl -s https://resend-ai-analyst.ravishankars.com/health || echo "❌ Health check failed"

logs:
	@echo "📋 Fetching deployment logs..."
	@wrangler tail

# API key validation
validate-keys:
	@echo "🔑 Validating API keys..."
	@node -r dotenv/config src/cli.js validate-keys

# Performance testing
benchmark:
	@echo "⏱️  Running performance benchmark..."
	@time make test-full-run

# Clean and reset
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf .wrangler
	@rm -rf node_modules/.cache

install:
	@echo "📦 Installing dependencies..."
	@npm install

# Help
help:
	@echo "🔧 Available commands:"
	@echo "  dev              - Start local development server"
	@echo "  deploy           - Deploy to production"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  test-finnhub     - Test earnings data fetching"
	@echo "  test-polygon     - Test options & volatility data"
	@echo "  test-volatility  - Test volatility analysis"
	@echo "  test-gemini      - Test AI analysis"
	@echo "  test-email       - Test email template"
	@echo "  test-pipeline    - Test complete pipeline"
	@echo "  test-full-run    - Simulate daily run"
	@echo ""
	@echo "🔍 Debugging:"
	@echo "  debug-run        - Run with debug output"
	@echo "  preview-email    - Preview email template"
	@echo "  test-stock SYMBOL=AAPL - Test specific stock"
	@echo "  validate-keys    - Check API key validity"
	@echo ""
	@echo "🚀 Production:"
	@echo "  verify-deployment - Check production health"
	@echo "  logs             - View deployment logs"

.PHONY: dev deploy test-finnhub test-polygon test-volatility test-gemini test-email test-scoring test-pipeline test-full-run preview-email debug-run verify-deployment logs validate-keys benchmark clean install help