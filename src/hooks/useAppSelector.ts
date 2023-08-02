import { TypedUseSelectorHook, useSelector } from 'react-redux'
import type { RootState } from '@/store/store'

/**
 * 在整个应用程序中使用，而不是简单的useSelector
 * 便于正确推断state的类型
 */
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export default useAppSelector
