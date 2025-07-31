# SATRF Website

A modern web application for the South African Target Rifle Federation (SATRF) built with Next.js, React, and Firebase.

## Features

- Modern, responsive design
- Member registration and authentication
- Event registration with PayFast integration
- Score tracking and leaderboards
- Document and photo upload
- Member forum
- Dark mode support

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- Firebase account
- PayFast merchant account

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/your-username/satrf-website.git
cd satrf-website
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with your Firebase configuration:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
satrf-website/
├── src/
│   ├── components/     # Reusable components
│   ├── lib/           # Firebase configuration and utilities
│   ├── pages/         # Next.js pages
│   └── styles/        # Global styles
├── public/            # Static assets
└── package.json       # Project dependencies
```

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [React](https://reactjs.org/) - UI library
- [Chakra UI](https://chakra-ui.com/) - Component library
- [Firebase](https://firebase.google.com/) - Backend services
- [PayFast](https://www.payfast.co.za/) - Payment gateway
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [React Hook Form](https://react-hook-form.com/) - Form handling
- [Zod](https://github.com/colinhacks/zod) - Schema validation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@satrf.org or create an issue in the repository. 