{ pkgs, lib, config, ... }:

{
  packages = [
    pkgs.git
  ];

  # Node.js (don't auto-install at root — our packages are in subdirs)
  languages.javascript.enable = true;

  # MinIO (local S3)
  services.minio = {
    enable = true;
    listenAddress = "127.0.0.1:9000";
    consoleAddress = "127.0.0.1:9001";
    accessKey = "minioadmin";
    secretKey = "minioadmin";
    region = "us-east-1";
    buckets = [
      "beli-at-home"
      "beli-at-home-backups"
    ];
    afterStart = ''
      mc anonymous set download local/beli-at-home
    '';
  };

  # Backend — wait a few seconds for MinIO to be ready
  processes.backend = {
    exec = "sleep 3 && cd $DEVENV_ROOT/backend && npm run dev";
    process-compose = {
      depends_on.minio.condition = "process_started";
      readiness_probe = {
        http_get = {
          host = "127.0.0.1";
          port = 3001;
          path = "/api/health";
        };
        initial_delay_seconds = 5;
        period_seconds = 5;
      };
    };
  };

  # Frontend
  processes.frontend = {
    exec = "cd $DEVENV_ROOT/frontend && npm run dev";
    process-compose = {
      depends_on.backend.condition = "process_healthy";
    };
  };

  # Install npm deps on shell entry if needed
  enterShell = ''
    echo "🍳 Beli at Home dev environment"
    echo ""
    if [ ! -d "$DEVENV_ROOT/backend/node_modules" ]; then
      echo "Installing backend dependencies..."
      (cd $DEVENV_ROOT/backend && npm install)
    else
      # Rebuild native modules if Node version changed
      (cd $DEVENV_ROOT/backend && npm rebuild better-sqlite3 sharp 2>/dev/null)
    fi
    if [ ! -d "$DEVENV_ROOT/frontend/node_modules" ]; then
      echo "Installing frontend dependencies..."
      (cd $DEVENV_ROOT/frontend && npm install)
    fi
    echo "Run 'devenv up' to start all services"
    echo "  Backend:       http://localhost:3001"
    echo "  Frontend:      http://localhost:5173"
    echo "  MinIO Console: http://localhost:9001"
  '';
}
