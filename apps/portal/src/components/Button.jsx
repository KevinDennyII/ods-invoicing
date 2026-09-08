import './ui.css';

const classes = ({ variant = 'primary', block = false, className = '' }) =>
  ['button', `button--${variant}`, block ? 'button--block' : '', className].filter(Boolean).join(' ');

export const Button = ({ variant, block, className, children, ...props }) => (
  <button className={classes({ variant, block, className })} {...props}>
    {children}
  </button>
);

/** Payment hand-offs leave our origin, so they are anchors rather than buttons. */
export const LinkButton = ({ variant, block, className, children, ...props }) => (
  <a className={classes({ variant, block, className })} {...props}>
    {children}
  </a>
);
