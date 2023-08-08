import { configureStore } from "@reduxjs/toolkit";
// 一般都以组件名xxxReducer方式命名
import counterReducer from "@/store/features/counterSlice";
import postsReducer from "@/store/features/postsSlice";

export const store = configureStore({
  // 合并多个slice
  reducer: {
    counter: counterReducer,
    posts: postsReducer
  }
})

// 从store本身推断出RootState和AppDispatch类型
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
