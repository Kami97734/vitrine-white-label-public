'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, scriptProps, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      scriptProps={{ async: true, ...(scriptProps ?? {}) }}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
