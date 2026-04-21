// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { createRoutesStub } from 'react-router'
import { describe, expect, it } from 'vitest'
import { Loading } from '~/components/Loading'

function renderAtIdle(ui: React.ReactElement) {
    const Stub = createRoutesStub([
        {
            path: '/',
            Component: () => ui,
        },
    ])
    return render(<Stub initialEntries={['/']} />)
}

describe('Loading', () => {
    it('renders nothing when navigation is idle and isLoading is not set', () => {
        const { container } = renderAtIdle(<Loading />)
        expect(container.firstChild).toBeNull()
    })

    it('renders a spinner when isLoading is true', () => {
        renderAtIdle(<Loading isLoading />)
        expect(screen.getByLabelText(/loading/i)).toBeInTheDocument()
    })

    it('renders an overlay + spinner when isLoading and overlay are true', () => {
        const { container } = renderAtIdle(<Loading isLoading overlay />)
        expect(container.querySelector('.overlay')).not.toBeNull()
        expect(screen.getByLabelText(/loading/i)).toBeInTheDocument()
    })
})
