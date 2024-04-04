/** *
 *construct __dirname to be usable as it were in commonJS without repeating these configuration accross all files where __dirname *is used
 * @author jsvoo
 */

import {fileURLToPath} from "url"
import {dirname} from "path"

const __filename = fileURLToPath(import.meta.url)
export const __dirname = dirname(__filename)
