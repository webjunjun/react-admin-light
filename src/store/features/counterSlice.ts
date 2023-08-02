import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CounterState } from "@/types/counterSlice.types";

const initialState: CounterState = {
  value: 0
}

// 创建counter切片并导出该切片
export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1
    },
    decrement: (state) => {
      state.value -= 1
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload
    }
  }
})

// 为每个reducer配置创建器action
// 给组件用的
export const {
  increment,
  decrement,
  incrementByAmount
} = counterSlice.actions

// 给store用的
export default counterSlice.reducer
