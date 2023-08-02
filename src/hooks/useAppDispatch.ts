import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store/store'

/**
 * 在整个应用程序中使用，而不是简单的useDispatch
 * 便于推断Thunk的类型
 */
const useAppDispatch: () => AppDispatch = useDispatch

export default useAppDispatch
