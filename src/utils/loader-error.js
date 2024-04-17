import { json } from 'react-router-dom'

export function throwErrorJsonIfError(error) {
  if (error?.isError) {
    console.log(error)
    throw json(
      {
        message: error.message,
      },
      {
        status: error.status,
      }
    )
  }
}
