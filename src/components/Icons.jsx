// Icons.jsx — compatibility shim (D-16 best-of-breed: icons → PAL).
// The hand-drawn 3-mark implementation was retired to ../_legacy/Icons.jsx (D-18, never deleted).
// These named exports now delegate to the adopted PAL Icon system so existing call sites
// (`import { CheckMark } from '../components/Icons.jsx'`) keep working unchanged.
import { Icon } from './Icon.jsx'

const inline = { verticalAlign: '-2px', marginRight: '3px' }

// Checkmark — success / correct / good
export const CheckMark = () => (
  <Icon name="check" size={14} strokeWidth={2} style={inline} />
)

// Cross — failure / wrong / bad
export const CrossMark = () => (
  <Icon name="x" size={14} strokeWidth={2} style={inline} />
)

// Warning — caution / alert / attention
export const WarningMark = () => (
  <Icon name="alert-triangle" size={14} strokeWidth={2} style={inline} />
)
