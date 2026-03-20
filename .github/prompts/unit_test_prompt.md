# Unit Test Generation Prompt for be-vui-hoc

## Instructions
When you want to generate a unit test for a file or component, provide the file path and reference this prompt. The assistant will:
- Analyze the file/component
- Generate a unit test file using React Testing Library and Jest (or your preferred setup)
- Follow project conventions for test structure and naming
- Ensure tests cover main logic, edge cases, and UI behavior

## Example Usage
```
[unit_test_prompt.md]
Generate unit test for: components/SpeechText.tsx
```

## Test Guidelines
- Place test files in __tests__ or next to the component
- Use descriptive test names
- Mock dependencies as needed
- Test both positive and negative cases

---
*Use this prompt for all future unit test generation requests in this project.*