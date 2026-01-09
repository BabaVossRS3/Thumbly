import { useEffect, useState } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  ogUrl?: string;
  author?: string;
  canonicalUrl?: string;
  twitterHandle?: string;
}

export default function SEO({
  title,
  description,
  keywords,
  ogImage = 'https://thumby.app/og-image.png',
  ogUrl,
  author = 'Thumby',
  canonicalUrl,
  twitterHandle = '@thumbyapp',
}: SEOProps) {
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    // Set current URL on client side only to avoid hydration mismatch
    if (!currentUrl && typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, [currentUrl]);

  useEffect(() => {
    // Set page title
    document.title = title;

    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Set keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords.join(', '));
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = keywords.join(', ');
      document.head.appendChild(meta);
    }

    // Set author
    const metaAuthor = document.querySelector('meta[name="author"]');
    if (metaAuthor) {
      metaAuthor.setAttribute('content', author);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'author';
      meta.content = author;
      document.head.appendChild(meta);
    }

    // Open Graph tags
    const setOGTag = (property: string, content: string) => {
      let og = document.querySelector(`meta[property="${property}"]`);
      if (og) {
        og.setAttribute('content', content);
      } else {
        og = document.createElement('meta');
        og.setAttribute('property', property);
        og.setAttribute('content', content);
        document.head.appendChild(og);
      }
    };

    setOGTag('og:title', title);
    setOGTag('og:description', description);
    setOGTag('og:image', ogImage);
    setOGTag('og:url', ogUrl || currentUrl);
    setOGTag('og:type', 'website');

    // Twitter Card tags
    const setTwitterTag = (name: string, content: string) => {
      let twitter = document.querySelector(`meta[name="${name}"]`);
      if (twitter) {
        twitter.setAttribute('content', content);
      } else {
        twitter = document.createElement('meta');
        twitter.setAttribute('name', name);
        twitter.setAttribute('content', content);
        document.head.appendChild(twitter);
      }
    };

    setTwitterTag('twitter:card', 'summary_large_image');
    setTwitterTag('twitter:title', title);
    setTwitterTag('twitter:description', description);
    setTwitterTag('twitter:image', ogImage);
    setTwitterTag('twitter:creator', twitterHandle);

    // Canonical URL
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute('href', canonicalUrl);
      } else {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        canonical.setAttribute('href', canonicalUrl);
        document.head.appendChild(canonical);
      }
    }

    // Cleanup function
    return () => {
      // Optional: Clean up on unmount if needed
    };
  }, [title, description, keywords, ogImage, ogUrl, author, canonicalUrl, twitterHandle, currentUrl]);

  return null;
}
