const prisma = require('../backend/lib/prisma');

function buildExcerpt(blog) {
  const source = blog.subtitle || blog.body1 || blog.body2 || blog.conclusion || '';
  return String(source).trim().slice(0, 160);
}

async function main() {
  const blogs = await prisma.blog.findMany();

  for (const blog of blogs) {
    await prisma.blog.update({
      where: { id: blog.id },
      data: {
        metaTitle: blog.metaTitle || blog.title,
        metaDescription: blog.metaDescription || buildExcerpt(blog),
        excerpt: blog.excerpt || buildExcerpt(blog),
        ogImage: blog.ogImage || blog.image1,
        publishedAt: blog.publishedAt || blog.createdAt,
        authorName: blog.authorName || 'Prime Cabs Melbourne',
        isPublished: blog.isPublished ?? true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Backfilled blog SEO fields');
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
