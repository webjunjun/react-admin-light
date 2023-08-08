import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

const ErrorPage: React.FC = () => {
  const error = useRouteError()
  const isError = isRouteErrorResponse(error)

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      {isError ? (<p>
        <i>{error.statusText || error.data?.message}</i>
      </p>) : ''}
    </div>
  )
}

export default ErrorPage
