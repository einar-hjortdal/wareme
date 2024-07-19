# LUUID

Wraps [Coachonko/lexical_uuid](https://github.com/Coachonko/lexical_uuid) for use with Bun.

The binary is built for Linux x64.

## Usage

```js
import { 
  LuuidGenerator, // used for luuid v1
  luuidV2 // generates luuid v2
  // utils
  luuidRemoveHyphens,
  luuidAddHyphens,
  luuidParse,
} from './luuid'

const idv2 = await luuidV2() // 0669a0b5-79ca-2318-c9fa-238f87e271e0
const idWithoutHyphens = await luuidRemoveHyphens(idv2) // 0669a0b579ca2318c9fa238f87e271e0
const idWithHyphens = await luuidAddHyphens(idWithoutHyphens) // 0669a0b5-79ca-2318-c9fa-238f87e271e0
const parsed = await luuidParse(idv2) // {"timestamp":1721371479,"version":2}

const luuid = new LuuidGenerator()
const idv1 = luuid.v1() // 0669a0c5-19f9-18c0-b403-413995f47027
```