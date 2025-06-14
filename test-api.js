const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TEST_TOPIC = 'JavaScript Promises';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test functions
async function testHealthCheck() {
  try {
    log('\n🏥 Testing Health Check...', 'blue');
    const response = await axios.get(`${API_BASE_URL}/health`);
    log(`✅ Health check passed: ${response.data.status}`, 'green');
    log(`📊 Available models: ${response.data.models.join(', ')}`, 'yellow');
    return true;
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, 'red');
    return false;
  }
}

async function testModels() {
  try {
    log('\n🤖 Testing Models Endpoint...', 'blue');
    const response = await axios.get(`${API_BASE_URL}/models`);
    const models = Object.keys(response.data.models);
    log(`✅ Models endpoint working: ${models.length} models available`, 'green');
    
    models.forEach(model => {
      const modelData = response.data.models[model];
      log(`  - ${model}: ${modelData.name} (${modelData.bestFor})`, 'yellow');
    });
    return true;
  } catch (error) {
    log(`❌ Models test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testContentGeneration() {
  try {
    log('\n📝 Testing Content Generation...', 'blue');
    const response = await axios.post(`${API_BASE_URL}/generate`, {
      topic: TEST_TOPIC,
      type: 'notes',
      model: 'gemma'
    });
    
    log(`✅ Content generation successful for topic: ${response.data.topic}`, 'green');
    log(`📄 Generated ${response.data.content.length} characters of content`, 'yellow');
    return response.data.content;
  } catch (error) {
    log(`❌ Content generation failed: ${error.response?.data?.error || error.message}`, 'red');
    return null;
  }
}

async function testCompleteGeneration() {
  try {
    log('\n📚 Testing Complete Study Kit Generation...', 'blue');
    const response = await axios.post(`${API_BASE_URL}/generate-all`, {
      topic: TEST_TOPIC,
      model: 'mistral'
    });
    
    log(`✅ Complete generation successful for topic: ${response.data.topic}`, 'green');
    log(`📄 Notes: ${response.data.content.notes.length} characters`, 'yellow');
    log(`📊 Slides: ${response.data.content.slides.length} characters`, 'yellow');
    log(`❓ MCQs: ${response.data.content.mcqs.length} characters`, 'yellow');
    return response.data.content;
  } catch (error) {
    log(`❌ Complete generation failed: ${error.response?.data?.error || error.message}`, 'red');
    return null;
  }
}

async function testExport(content) {
  if (!content) {
    log('\n⚠️  Skipping export test (no content available)', 'yellow');
    return false;
  }

  try {
    log('\n📄 Testing Export Functionality...', 'blue');
    const response = await axios.post(`${API_BASE_URL}/export`, {
      content: content,
      format: 'md',
      filename: 'test-export'
    });
    
    log(`✅ Export successful: ${response.data.filename}`, 'green');
    log(`📁 Download URL: ${response.data.downloadUrl}`, 'yellow');
    return true;
  } catch (error) {
    log(`❌ Export failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testTopics() {
  try {
    log('\n🗂️  Testing Topics Management...', 'blue');
    const response = await axios.get(`${API_BASE_URL}/topics`);
    
    log(`✅ Topics endpoint working: ${response.data.total} topics found`, 'green');
    if (response.data.topics.length > 0) {
      log(`📚 Recent topics:`, 'yellow');
      response.data.topics.slice(0, 3).forEach(topic => {
        log(`  - ${topic.title} (accessed ${topic.accessCount} times)`, 'yellow');
      });
    }
    return true;
  } catch (error) {
    log(`❌ Topics test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testStats() {
  try {
    log('\n📊 Testing Statistics...', 'blue');
    const response = await axios.get(`${API_BASE_URL}/stats`);
    
    log(`✅ Stats endpoint working`, 'green');
    log(`📈 Total topics: ${response.data.stats.totalTopics}`, 'yellow');
    log(`🔢 Total generations: ${response.data.stats.totalGenerations}`, 'yellow');
    return true;
  } catch (error) {
    log(`❌ Stats test failed: ${error.message}`, 'red');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting ClassGPT API Tests', 'blue');
  log(`🔗 Testing against: ${API_BASE_URL}`, 'yellow');
  
  const results = [];
  
  // Run tests in sequence
  results.push(await testHealthCheck());
  results.push(await testModels());
  
  const content = await testContentGeneration();
  results.push(content !== null);
  
  const completeContent = await testCompleteGeneration();
  results.push(completeContent !== null);
  
  results.push(await testExport(content || (completeContent && completeContent.notes)));
  results.push(await testTopics());
  results.push(await testStats());
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  log('\n📋 Test Results Summary:', 'blue');
  log(`✅ Passed: ${passed}/${total} tests`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('🎉 All tests passed! Your ClassGPT API is working correctly.', 'green');
  } else {
    log('⚠️  Some tests failed. Check the output above for details.', 'yellow');
  }
  
  // Check for common issues
  if (!results[0]) {
    log('\n💡 Troubleshooting Tips:', 'blue');
    log('- Make sure the server is running on the correct port', 'yellow');
    log('- Check if OPENROUTER_API_KEY is set in your .env file', 'yellow');
    log('- Verify your internet connection', 'yellow');
  }
  
  return passed === total;
}

// Command line interface
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`💥 Test runner crashed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testHealthCheck,
  testModels,
  testContentGeneration,
  testCompleteGeneration,
  testExport,
  testTopics,
  testStats
};