import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				
				/* Brand Colors */
				brand: {
					blue: 'hsl(var(--brand-blue))',
					'blue-light': 'hsl(var(--brand-blue-light))',
					'blue-dark': 'hsl(var(--brand-blue-dark))',
					green: 'hsl(var(--brand-green))',
					'green-light': 'hsl(var(--brand-green-light))',
					'green-dark': 'hsl(var(--brand-green-dark))',
				},
				
				/* Theme Colors */
				admin: {
					primary: 'hsl(var(--admin-primary))',
					'primary-foreground': 'hsl(var(--admin-primary-foreground))',
					secondary: 'hsl(var(--admin-secondary))',
					'secondary-foreground': 'hsl(var(--admin-secondary-foreground))',
					accent: 'hsl(var(--admin-accent))',
					'accent-foreground': 'hsl(var(--admin-accent-foreground))',
					muted: 'hsl(var(--admin-muted))',
					'muted-foreground': 'hsl(var(--admin-muted-foreground))',
					sidebar: 'hsl(var(--admin-sidebar))',
					'sidebar-foreground': 'hsl(var(--admin-sidebar-foreground))',
				},
				
				tenant: {
					primary: 'hsl(var(--tenant-primary))',
					'primary-foreground': 'hsl(var(--tenant-primary-foreground))',
					secondary: 'hsl(var(--tenant-secondary))',
					'secondary-foreground': 'hsl(var(--tenant-secondary-foreground))',
					accent: 'hsl(var(--tenant-accent))',
					'accent-foreground': 'hsl(var(--tenant-accent-foreground))',
					muted: 'hsl(var(--tenant-muted))',
					'muted-foreground': 'hsl(var(--tenant-muted-foreground))',
					sidebar: 'hsl(var(--tenant-sidebar))',
					'sidebar-foreground': 'hsl(var(--tenant-sidebar-foreground))',
				},
				
				/* Status Colors */
				status: {
					new: 'hsl(var(--status-new))',
					processing: 'hsl(var(--status-processing))',
					completed: 'hsl(var(--status-completed))',
					cancelled: 'hsl(var(--status-cancelled))',
					pending: 'hsl(var(--status-pending))',
				},
				
				/* Base Theme Colors */
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			backgroundImage: {
				'gradient-admin': 'var(--gradient-admin)',
				'gradient-tenant': 'var(--gradient-tenant)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-card': 'var(--gradient-card)',
			},
			boxShadow: {
				'custom-sm': 'var(--shadow-sm)',
				'custom-md': 'var(--shadow-md)',
				'custom-lg': 'var(--shadow-lg)',
				'custom-xl': 'var(--shadow-xl)',
				'glow': 'var(--shadow-glow)',
				'glow-green': 'var(--shadow-glow-green)',
			},
			transitionDuration: {
				'fast': '150ms',
				'normal': '300ms',
				'slow': '500ms',
			},
			spacing: {
				'sidebar': 'var(--sidebar-width)',
				'sidebar-collapsed': 'var(--sidebar-width-collapsed)',
				'header': 'var(--header-height)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
