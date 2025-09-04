# How to Create a Course (A Guide)

This guide explains how to create a new course in Markdown format for this documentation site.  
It is tailored for professionals and subject matter experts who want to make courses visually clear, structured, and easy to navigate.

---

## 1. Download the Course Template

Every new course should start from the template to ensure consistency.

👉 <a href="/files/course-template.md" download="course-template.md">Download Course Template</a>

The template contains:

- Standard headings
- Sections for description, prerequisites, lessons, and resources
- Example formatting (lists, links, and exercises)

---

## 2. Organize Your Files

1. Save the downloaded template into the project folder:
2. Rename the file to match your course name. Use lowercase letters and dashes for spaces:

   ```
   eg. how-to-create-a-course.md

    💡 Tip: A clear filename makes it easier to reference the course later.
   ```

---

## 3. Fill Out the Template with Content

When writing your course, focus on **clarity, structure, and design consistency**.

### 3.1 Course Title & Description

- Title should be **short and descriptive**.  
  Example: `Responsive Web Design`
- Description should be **1–3 sentences** explaining what the learner will achieve.  
  Example:
  > Learn the foundations of responsive design, including fluid grids, flexible images, and media queries.

### 3.2 Prerequisites

- List skills or tools required before taking the course.
- Keep it in bullet points for easy scanning.
- Example:
- Basic knowledge of HTML & CSS
- Familiarity with browser developer tools

### 3.3 Content Sections (Lessons/Modules)

Break the course into lessons or modules. Use headings (`##` or `###`) to make them scannable.

    Example:

    ```markdown
    ## Lesson 1: Fluid Layouts

    - Explain why fixed layouts break
    - Show examples of fluid grids
    - Provide short CSS code snippets
    ```

### 3.4 Exercises / Activities

Always include at least one practical task per lesson.

Make activities action-oriented: `Design a wireframe`, `Create a grid system`, `Test on 3 devices`.

### 3.5 Resources

Provide curated links to design systems, UI kits, articles, and tools.

Example:

```Google Material Design
Smashing Magazine on Responsive Design
```

## 4. Design & Formatting Guidelines

- Pay attention to how your Markdown looks when rendered.

- Use hierarchy properly:

  ```
  # for course title (only once)

  ## for major sections

  ### for subsections
  ```

- Use lists instead of long paragraphs for better readability.

- Add visuals when helpful:

- Share any images and screenshots linked in a course. Place images in `/static/img/courses/` and reference them like:

`![Wireframe Example](/img/template/lisa_landing_page.png)`

Use callouts/admonitions for emphasis:

:::tip
Always test your layout on both desktop and mobile!
:::

5. Share the Course for Upload

Once your course is ready:

Review for:

Consistency with other courses

Clear structure and headings

Proper spelling and grammar

Accessibility (e.g., alt text for images)

Share the .md file with the site admin for publishing.

✅ Summary

By following this guide, you will:

Start from a reusable template

Write structured, designer-friendly courses

Ensure readability and consistency across the documentation hub

Deliver professional, accessible learning content

---

⚡ This version is **longer, more structured, and designer-focused** (hierarchy, formatting, visuals, readability).

Do you want me to also **export this improved version as a Word file** like we did with the last one?
