# BMad Analysis Engine Tests

This directory contains comprehensive test suites for the BMad Monetization Strategy Engine, validating all four integrated analysis systems.

## Test Structure

### Unit Tests
- **`pricing-model-analyzer.test.ts`** - Tests for the pricing model analysis engine
- **`competitive-pricing-analyzer.test.ts`** - Tests for competitive intelligence system
- **`revenue-optimization-engine.test.ts`** - Tests for revenue optimization (TODO)
- **`growth-strategy-engine.test.ts`** - Tests for growth strategy planning (TODO)

### Integration Tests
- **`analysis-integration.test.ts`** - Cross-engine integration and workflow tests

## Test Coverage Areas

### Pricing Model Analyzer Tests
- ✅ Basic pricing model analysis functionality
- ✅ 12 different pricing model type recommendations
- ✅ Price optimization and Van Westendorp analysis
- ✅ Competitive data integration
- ✅ Implementation planning and risk assessment
- ✅ Error handling and edge cases
- ✅ Performance with large datasets

### Competitive Pricing Analyzer Tests
- ✅ Complete competitive analysis workflow
- ✅ Market position assessment (underpriced, competitive, premium, overpriced)
- ✅ Price gap analysis and market opportunities
- ✅ Threat assessment and mitigation strategies
- ✅ Different analysis types (positioning, gap-analysis, optimization, strategy-review)
- ✅ Report generation functionality
- ✅ Confidence scoring based on data quality
- ✅ Timeframe-based recommendations
- ✅ Input validation and error handling

### Analysis Integration Tests
- ✅ Complete monetization analysis pipeline
- ✅ Cross-engine data flow and consistency
- ✅ Quick revenue optimization workflows
- ✅ Competitive intelligence analysis
- ✅ Growth strategy planning integration
- ✅ Engine health validation
- ✅ Error resilience and graceful degradation
- ✅ Performance with large datasets
- ✅ Data consistency and validation

## Running the Tests

### Prerequisites
```bash
npm install
# or
yarn install
```

### Run All Analysis Tests
```bash
# Run all tests in this directory
npm test __tests__/bmad/analysis/

# Run with coverage
npm test -- --coverage __tests__/bmad/analysis/
```

### Run Specific Test Suites
```bash
# Unit tests
npm test pricing-model-analyzer.test.ts
npm test competitive-pricing-analyzer.test.ts

# Integration tests
npm test analysis-integration.test.ts
```

### Run in Watch Mode
```bash
npm test -- --watch __tests__/bmad/analysis/
```

## Test Data and Mocks

### Mock Business Data
All tests use consistent mock data structures:
- **Customer Segments**: Small Business segment with defined pain points and jobs-to-be-done
- **Revenue Streams**: SaaS subscription model with monthly pricing
- **Competitor Data**: Sample competitor with pricing plans and feature comparisons

### Mock Scenarios
- **Basic Analysis**: Standard business model analysis
- **Competitive Analysis**: Analysis with competitor intelligence data
- **Large Dataset**: Scalability testing with multiple segments and competitors
- **Edge Cases**: Invalid data, empty datasets, missing fields

## Test Patterns and Best Practices

### Test Structure
Each test suite follows the pattern:
```typescript
describe('EngineClass', () => {
  let engine: EngineClass;
  let mockData: MockDataType;

  beforeEach(() => {
    // Setup engine and mock data
  });

  describe('core functionality', () => {
    // Core feature tests
  });

  describe('edge cases and error handling', () => {
    // Error handling tests
  });

  describe('performance', () => {
    // Performance and scalability tests
  });
});
```

### Assertion Patterns
- **Structure Validation**: All analysis results have required properties
- **Type Safety**: Proper TypeScript type checking in tests
- **Business Logic**: Validate business rules and calculations
- **Error Boundaries**: Graceful handling of invalid inputs
- **Performance**: Execution time limits and resource usage

### Mock Data Guidelines
- Use realistic business scenarios
- Maintain data consistency across tests
- Include both positive and negative test cases
- Test boundary conditions and edge cases

## Coverage Goals

### Current Coverage
- **Pricing Model Analyzer**: ~85% coverage
- **Competitive Pricing Analyzer**: ~90% coverage
- **Integration Tests**: ~75% coverage

### Target Coverage
- **Overall**: >85% line coverage
- **Critical Paths**: 100% coverage for main analysis workflows
- **Error Paths**: >80% coverage for error handling scenarios

## Known Test Limitations

### TODO: Additional Test Files Needed
- `revenue-optimization-engine.test.ts` - Revenue optimization unit tests
- `growth-strategy-engine.test.ts` - Growth strategy unit tests
- `performance-benchmarks.test.ts` - Detailed performance testing
- `e2e-workflow.test.ts` - End-to-end user workflow testing

### TODO: Enhanced Test Scenarios
- Multi-currency pricing scenarios
- International competitor analysis
- Industry-specific business model testing
- Real-world data integration testing

## Debugging Tests

### Common Issues
1. **Async/Await**: Ensure proper async handling for competitive analysis
2. **Mock Data**: Verify mock data matches expected TypeScript interfaces
3. **Timeouts**: Increase timeout for complex analysis scenarios
4. **Memory**: Large dataset tests may require increased memory limits

### Debug Commands
```bash
# Run with verbose output
npm test -- --verbose __tests__/bmad/analysis/

# Run single test with debugging
npm test -- --testNamePattern="should analyze pricing models successfully"

# Run with Node debugging
node --inspect-brk node_modules/.bin/jest __tests__/bmad/analysis/
```

## Contributing

### Adding New Tests
1. Follow the existing test structure patterns
2. Include both positive and negative test cases
3. Add performance considerations for complex analyses
4. Update this README with new test descriptions

### Test Data Updates
1. Keep mock data realistic and representative
2. Maintain consistency across test suites
3. Document any new mock data scenarios
4. Ensure TypeScript compatibility

### Performance Testing
1. Set reasonable execution time limits
2. Test with realistic dataset sizes
3. Monitor memory usage for large analyses
4. Consider async operation handling

---

**Test Suite Status**: ✅ Core functionality covered, integration validated  
**Last Updated**: September 5, 2025  
**Coverage Target**: 85%+ line coverage across all analysis engines