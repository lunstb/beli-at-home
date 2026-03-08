.PHONY: dev clean db-wipe db-backup install build lint

# Start the full dev environment
dev:
	devenv up

# Install all dependencies
install:
	cd backend && npm install
	cd frontend && npm install

# Build both projects
build:
	cd frontend && npm run build
	cd backend && npx tsc --noEmit

# Wipe the database (destructive!)
db-wipe:
	@echo "⚠️  This will delete ALL data from the database."
	@read -p "Are you sure? (y/N) " confirm && [ "$$confirm" = "y" ] || exit 1
	rm -f backend/data/beli.db backend/data/beli.db-wal backend/data/beli.db-shm
	@echo "✅ Database wiped. Restart the backend to recreate."

# Wipe database without confirmation (for scripts/CI)
db-wipe-force:
	rm -f backend/data/beli.db backend/data/beli.db-wal backend/data/beli.db-shm

# Clean all build artifacts and dependencies
clean:
	rm -rf frontend/dist frontend/node_modules backend/node_modules
	@echo "✅ Cleaned build artifacts and node_modules"

# Clean everything including database
clean-all: clean db-wipe-force
	rm -rf backend/uploads
	@echo "✅ Cleaned everything including database and uploads"
