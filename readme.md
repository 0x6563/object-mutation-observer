
## Goals
- Create an object that captures all mutations
- Work with all objects including functions, classes and recursion

## Requirements 
- Drop in replacement for the original object. **No Code Changes required** ie `obj.a = '1'` should not need to be changed to `set(obj.a, '1')`
- Implementation should not leak into observed objects
- Allow listening of changes at any nested level
- Only one event per modification
