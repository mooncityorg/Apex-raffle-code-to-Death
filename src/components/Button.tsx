export function Button(props: { title?: string, style?: any, className?: string, children: any }) {
    return (
        <button className={`btn ${props.className}`} style={props.style}>
            <span>{props.children}</span>
        </button>
    )
}