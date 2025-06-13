# Docker + Vite Import Resolution Troubleshooting

This document addresses the systematic import resolution issues that can occur with drag-and-drop libraries and other npm packages after Docker restarts.

## Problem Description

After restarting Docker containers, you may encounter import resolution errors like:
```
[plugin:vite:import-analysis] Failed to resolve import '@dnd-kit/core'
[plugin:vite:import-analysis] Failed to resolve import 'react-dnd'
[plugin:vite:import-analysis] Failed to resolve import '@atlaskit/pragmatic-drag-and-drop'
```

## Root Causes

### 1. **Docker Volume Mount Conflicts**
- Anonymous volumes can cause platform binary mismatches between host (macOS) and container (Linux)
- Solution: Use named volumes for `node_modules`

### 2. **Vite Cache Corruption**
- Vite cache in `node_modules/.vite/` becomes stale after Docker restart
- TypeScript build info in `node_modules/.tmp/` can also become corrupted

### 3. **TypeScript `verbatimModuleSyntax` Conflicts**
- Strict TypeScript 5.0+ feature that conflicts with many npm packages
- Drag-and-drop libraries often don't support this setting

### 4. **Module Resolution Configuration**
- Vite's bundler mode + Docker can cause module resolution failures
- Dependencies need explicit pre-bundling configuration

## Solutions Implemented

### ✅ Docker Configuration (`docker-compose.yml`)
```yaml
frontend:
  volumes:
    - ./frontend:/app
    - frontend_node_modules:/app/node_modules  # Named volume prevents binary conflicts
```

### ✅ TypeScript Configuration (`tsconfig.app.json`)
```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": false  // Disabled for compatibility
  }
}
```

### ✅ Vite Configuration (`vite.config.ts`)
```typescript
export default defineConfig({
  optimizeDeps: {
    include: [
      // Explicit pre-bundling of drag-drop libraries
      '@dnd-kit/core',
      '@dnd-kit/sortable', 
      '@dnd-kit/utilities',
      'react-dnd',
      'react-dnd-html5-backend',
      '@atlaskit/pragmatic-drag-and-drop'
    ],
    force: true  // Force rebuild to clear cache issues
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 1000,
    },
    hmr: {
      port: 5173,
    },
  }
})
```

### ✅ Dockerfile Enhancements (`docker/Dockerfile.frontend`)
```dockerfile
# Clear cache on container start
CMD ["sh", "-c", "rm -rf node_modules/.vite node_modules/.tmp 2>/dev/null || true && npm run dev:docker"]
```

### ✅ Cache Management Scripts (`package.json`)
```json
{
  "scripts": {
    "dev:force": "vite --force",
    "dev:docker": "vite --host 0.0.0.0 --force",
    "clear-cache": "rm -rf node_modules/.vite && rm -rf node_modules/.tmp",
    "docker:clear-cache": "docker exec nextgencrm-frontend rm -rf /app/node_modules/.vite && docker exec nextgencrm-frontend rm -rf /app/node_modules/.tmp",
    "docker:rebuild": "docker-compose down && docker volume rm nextgencrm_frontend_node_modules 2>/dev/null || true && docker-compose up --build",
    "docker:restart": "docker-compose restart frontend",
    "docker:fix-imports": "npm run docker:clear-cache && npm run docker:restart"
  }
}
```

## Quick Recovery Commands

### 🚀 Quick Fix (Most Common)
```bash
npm run docker:fix-imports
```

### 🔄 Alternative Quick Fix
```bash
npm run docker:clear-cache
npm run docker:restart
```

### 🏗️ Full Rebuild (If Quick Fix Doesn't Work)
```bash
npm run docker:rebuild
```

### 🛠️ Manual Debugging Steps
```bash
# 1. Check if containers are running
docker-compose ps

# 2. Check frontend container logs
docker-compose logs frontend

# 3. Exec into container to inspect
docker exec -it nextgencrm-frontend sh
ls -la node_modules/@dnd-kit/
ls -la node_modules/.vite/

# 4. Clear cache manually
docker exec nextgencrm-frontend rm -rf /app/node_modules/.vite
docker exec nextgencrm-frontend rm -rf /app/node_modules/.tmp

# 5. Restart frontend service
docker-compose restart frontend
```

## Prevention

### 📋 Best Practices
1. **Always use named volumes** for `node_modules` in Docker
2. **Force cache rebuild** after Docker environment changes
3. **Disable strict TypeScript features** that conflict with npm packages
4. **Pre-bundle dependencies** explicitly in Vite config

### 🔍 Early Warning Signs
- Import resolution errors after Docker restart
- Drag-and-drop libraries failing to import
- Vite complaining about missing modules
- TypeScript build errors with module resolution

### 🎯 Testing Import Resolution
```bash
# Test if imports work
docker exec nextgencrm-frontend npm run build

# Check specific import
docker exec nextgencrm-frontend node -e "console.log(require.resolve('@dnd-kit/core'))"
```

## Environment-Specific Notes

### macOS + Docker
- Platform binary mismatches are most common
- Named volumes are critical
- File watching needs polling

### Linux + Docker
- Generally fewer issues
- Native file watching works better
- Still benefits from cache management

### Windows + Docker
- Similar to macOS issues
- WSL2 can add complexity
- Volume performance considerations

## Related Issues

- [Vite Import Analysis Issues](https://github.com/vitejs/vite/issues)
- [Docker + Node.js Module Resolution](https://github.com/nodejs/node/issues)
- [TypeScript verbatimModuleSyntax Compatibility](https://github.com/microsoft/TypeScript/issues)

## Support

If you continue to experience import resolution issues after applying these fixes:

1. Check that all configuration changes were applied correctly
2. Try the full rebuild process
3. Verify Docker volume configurations
4. Test with a minimal reproduction case

Last Updated: June 2025