export interface SectionTitleProps {
    text1: string;
    text2: string;
    text3: string;
    color?: 'pink' | 'blue' | 'purple' | 'green' | 'orange' | 'cyan';
}

export interface TestimonialCardProps {
    testimonial: ITestimonial;
    index: number;
}

export interface ITestimonial {
    image: string;
    name: string;
    handle: string;
    date: string;
    quote: string;
}

export interface IFeature {
    icon: string;
    title: string;
    description: string;
}

export interface IFooter {
    title: string;
    links: IFooterLink[];
}

export interface IFooterLink {
    name: string;
    href: string;
}

export interface NavbarProps {
    navlinks: INavLink[];
}

export interface INavLink {
    name: string;
    href: string;
}

export interface PricingCardProps {
    pricing: IPricing;
    index: number;
}

export interface IPricing {
    name: string;
    price: number;
    period: string;
    features: string[];
    mostPopular: boolean;
}

export interface SectionProps {
    title: string;
    description: string;
    buttonText: string;
    buttonHref: string;
}

export interface YouTubeProject {
    _id: string;
    projectName: string;
    videoTitle: string;
    videoDescription: string;
    tags: string[];
    category?: string;
    thumbnailId?: string;
    thumbnailUrl?: string;
    youtubeVideoId?: string;
    uploadedToYouTube: boolean;
    createdAt: string;
}