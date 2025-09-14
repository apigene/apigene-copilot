# Database Adapter Implementation

This implementation allows switching between PostgreSQL and MongoDB repositories using environment variables.

## Current Status

- ✅ MongoDB stub implementation created
- ✅ User repository adapter implemented
- ✅ MCP repository adapter implemented
- ✅ MCP OAuth repository adapter implemented
- ✅ MCP Server Customization repository adapter implemented
- ✅ MCP Tool Customization repository adapter implemented
- ✅ Agent repository adapter implemented
- ✅ Archive repository adapter implemented
- ✅ Bookmark repository adapter implemented
- ✅ Chat repository adapter implemented
- ✅ Workflow repository adapter implemented
- ✅ All existing PostgreSQL code remains untouched
- ✅ Zero breaking changes

## Usage

### Default Behavior (PostgreSQL)
```bash
# No environment variable needed - defaults to PostgreSQL
npm run dev
```

### Switch to MongoDB (Stub Implementation)
```bash
# Set environment variable to use MongoDB stub
REPOSITORY_DB=mongodb npm run dev
```

## Implementation Details

### Files Added
- `src/lib/db/mongo/db.mongo.ts` - MongoDB connection
- `src/lib/db/mongo/schema.mongo.ts` - MongoDB document schemas
- `src/lib/db/mongo/repositories/user-repository.mongo.ts` - MongoDB User repository stub
- `src/lib/db/mongo/repositories/mcp-repository.mongo.ts` - MongoDB MCP repository stub
- `src/lib/db/mongo/repositories/mcp-oauth-repository.mongo.ts` - MongoDB MCP OAuth repository stub
- `src/lib/db/mongo/repositories/mcp-server-customization-repository.mongo.ts` - MongoDB MCP Server Customization repository stub
- `src/lib/db/mongo/repositories/mcp-tool-customization-repository.mongo.ts` - MongoDB MCP Tool Customization repository stub
- `src/lib/db/mongo/repositories/agent-repository.mongo.ts` - MongoDB Agent repository stub
- `src/lib/db/mongo/repositories/archive-repository.mongo.ts` - MongoDB Archive repository stub
- `src/lib/db/mongo/repositories/bookmark-repository.mongo.ts` - MongoDB Bookmark repository stub
- `src/lib/db/mongo/repositories/chat-repository.mongo.ts` - MongoDB Chat repository stub
- `src/lib/db/mongo/repositories/workflow-repository.mongo.ts` - MongoDB Workflow repository stub

### Files Modified
- `src/lib/db/repository.ts` - Added adapter logic (minimal change)

### Current Behavior
The MongoDB repositories (all repositories) currently delegate all calls to the PostgreSQL implementation, ensuring:
- ✅ No breaking changes
- ✅ Same functionality as before
- ✅ Ready for incremental MongoDB implementation

## Next Steps

1. **Implement MongoDB Repositories**: Replace stub methods with actual MongoDB operations
2. **Add More Repositories**: Create MongoDB stubs for other repositories (chat, workflow, etc.)
3. **Gradual Migration**: Switch repositories one by one using `REPOSITORY_DB=mongodb`

## Environment Variables

```bash
# Database selection
REPOSITORY_DB=mongodb  # or 'postgresql' (default)

# MongoDB connection
MONGO_DB_URL=mongodb://localhost:27017/apigene-copilot
```
