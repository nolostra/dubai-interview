/**
 * OpenAPI 3 spec for Agent Panel API. Served at /api-docs.
 */
export const openApiSpec = {
  openapi: '3.0.0',
  info: { title: 'Agent Panel API', version: '1.0.0', description: 'Backend API for the Agent Dashboard.' },
  servers: [{ url: '/api', description: 'API base' }],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Login',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } },
            },
          },
        },
        responses: { 200: { description: 'Returns agent and token' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/auth/forgot-password': {
      post: {
        summary: 'Forgot password (dummy: no email sent)',
        tags: ['Auth'],
        requestBody: {
          content: {
            'application/json': { schema: { type: 'object', properties: { email: { type: 'string' } } } },
          },
        },
        responses: { 200: { description: 'Success message' } },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Current agent profile',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Agent profile' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/auth/change-password': {
      patch: {
        summary: 'Change password',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Password updated' }, 400: { description: 'Invalid current password' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/agents/dashboard': {
      get: {
        summary: 'Dashboard KPIs and last 7 days earnings',
        tags: ['Agents'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Dashboard data' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/agents/profile': {
      get: {
        summary: 'Get profile',
        tags: ['Agents'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Agent profile' }, 401: { description: 'Unauthorized' } },
      },
      patch: {
        summary: 'Update profile (name)',
        tags: ['Agents'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } },
          },
        },
        responses: { 200: { description: 'Updated profile' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/users': {
      get: {
        summary: 'List users (paginated)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { 200: { description: 'Users and total' }, 401: { description: 'Unauthorized' } },
      },
      post: {
        summary: 'Create user',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', required: ['name', 'email'], properties: { name: { type: 'string' }, email: { type: 'string' } } },
            },
          },
        },
        responses: { 201: { description: 'User created' }, 400: { description: 'Validation error' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/users/{id}': {
      get: {
        summary: 'Get user by ID',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User' }, 401: { description: 'Unauthorized' }, 404: { description: 'Not found' } },
      },
    },
    '/users/{id}/block': {
      patch: {
        summary: 'Block user',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User blocked' }, 401: { description: 'Unauthorized' }, 404: { description: 'Not found' } },
      },
    },
    '/users/{id}/unblock': {
      patch: {
        summary: 'Unblock user',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User unblocked' }, 401: { description: 'Unauthorized' }, 404: { description: 'Not found' } },
      },
    },
    '/commissions/history': {
      get: {
        summary: 'Commission history (date-wise)',
        tags: ['Commissions'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'] } },
        ],
        responses: { 200: { description: 'History or CSV' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/withdrawals': {
      get: {
        summary: 'List withdrawals',
        tags: ['Withdrawals'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Withdrawals list' }, 401: { description: 'Unauthorized' } },
      },
      post: {
        summary: 'Request withdrawal',
        tags: ['Withdrawals'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': { schema: { type: 'object', required: ['amount'], properties: { amount: { type: 'number' } } } },
          },
        },
        responses: { 201: { description: 'Withdrawal requested' }, 400: { description: 'Invalid amount' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/admin/withdrawals/{id}/approve': {
      patch: {
        summary: 'Approve withdrawal (admin)',
        tags: ['Admin'],
        security: [{ adminKey: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Approved' }, 401: { description: 'Invalid X-Admin-Key' }, 404: { description: 'Not found' } },
      },
    },
    '/admin/withdrawals/{id}/reject': {
      patch: {
        summary: 'Reject withdrawal (admin)',
        tags: ['Admin'],
        security: [{ adminKey: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Rejected' }, 401: { description: 'Invalid X-Admin-Key' }, 404: { description: 'Not found' } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'JWT from login' },
      adminKey: { type: 'apiKey', in: 'header', name: 'X-Admin-Key', description: 'Admin API key' },
    },
  },
} as const;
