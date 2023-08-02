import useAppDispatch from '@/hooks/useAppDispatch';
import useAppSelector from '@/hooks/useAppSelector';
import { decrement, increment } from '@/store/features/counterSlice';
import React from 'react';

const Counter: React.FC = () => {
  const dispatch = useAppDispatch()
  const count = useAppSelector((store) => store.counter.value)
  console.log(count)

  return (
    <>
      <button onClick={() => dispatch(increment())}>增加+</button>
        <span>{count}</span>
      <button onClick={() => dispatch(decrement())}>减少-</button>
    </>
  )
}

export default Counter;
