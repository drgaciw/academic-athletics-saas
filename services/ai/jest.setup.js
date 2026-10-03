process.env.NODE_ENV = 'test'
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/aah_test'
process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'sk_test_clerk_secret_key_1234567890'
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-jwt-secret-key-32-chars-min!!'
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-openai-key'
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'sk-ant-test-key'
