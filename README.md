# Introuction
Welcome to 11tyCMS! 11tyCMS is a local, serverless, offline CMS for the 11ty SSG. Simply install, and launch.

## Where can I download it?
We're hosting builds on [GitHub](https://github.com/jh97uk/11tyCMS/releases/tag/beta). I'd love to host them on this repo, but unfortunately, the release size limits on Codeberg cap out at 100mb. If anyone knows how to reduce our build sizes, please create an issue!

I've requested larger release size caps, but Codeberg have said they have no ability to change this for individual users at this time.

### Why Codeberg anyway?
11tyCMS is a project that seeks to help federate the web: I want more websites. I want more of our content, writing, creativity and the internet's soul to be out of the hands of centralised big tech platforms. GitHub and its parent company Microsoft has shown themselves to be ethically spurious to say the least on many levels, and their use of AI training is deeply concerning. It's not something I want to contribute to.

## Bugs DISCLAIMER!
I've been using this for my portfolio and the 11tyCMS website for a while now. I've not encountered any major issues. However, backup regularly and practise great caution while using. This is early beta afterall.

Please see the issues tab for common bugs to look out for while using these early builds.

## Getting your site 11tyCMS ready
11tyCMS requires all your posts to be in a "content folder". It doesn't matter the name of the folder, this is configured in the setup.

11tyCMS has been built around the [`eleventy-base-blog` template](https://github.com/11ty/eleventy-base-blog), so try and follow the structure and naming schemes of this template.

For a collection to work with 11tyCMS, you'll need the collection's folder in the content folder, followed by a js or json file inside of that folder with the matching name. For example:

If you have a posts collection, create a `posts` folder in your `content` folder, and inside of it, create a file called `posts.11tydata.js`. 11tyCMS will scan the `content` folder and find all the subfolders with their associated `11tydata` files.

At present, for image "uploads" to work, the `assets` folder must be in your `content` folder.

If you want to create collections in 11tyCMS, ensure you configure the layouts directory in the setup wizzard to point to where your layouts are. For example, if you have your layouts in the `_includes/layouts` folder, then you'll need to configure the `_includes` directory to that. I'm working on making this better, but for now that's what we have.

A more detailed guide is on the way, but for the most part, the welcome wizard should do the heavy lifting.

11tyCMS mostly looks for any 11tyCMS related settings on your website in the `_11tycms.json` file in the root of your website. My portfolio looks like this (as an example):
```json
{
    "build": "npx @11ty/eleventy",
    "publish": "git add . && git commit -a -m \"$(git status --short | sed 's/^...//g' | paste -sd ', ' -)\" && git push",
    "input": "content",
    "includes": "_includes/layouts",
    "data": "_data",
    "media": "content/assets",
    "output": "_site"
}
```
If you want to skip the welcome wizard, just create an `_11tycms.json` file in your site's root directory.

Note that any config file or `11tydata` file can be either .json, .js, or .tsx. However if you have 2 files with different formats, this will cause bugs!

If you'd like to see an example of an 11ty site working with 11tyCMS, refer to [my portfolio](https://codeberg.org/JessieHealdUK/Portfolio) (just remember to create a `content` folder!).

# Development
To setup the source for development run `npm install`. You'll get an error about `electron-builder`, ignore it for now, I'm in the process of fixing it.

To run in dev mode: `npm run dev`

## Building
If you want to build executables for your system, you'll need to run one of my `publish` commands:
- `npm run publish:windows` will create a setup executable for your target hosts arch on Windows
- `npm run publish:linux` will do the same on Linux.
- `npm run publish:mac` will do the same on Linux.

### Limitations
Unfortunately, the build/publish process is very limited. You must create builds for each platform on the OS you're targeting. This is because `sqlite3` can't be built for the target platform without being on the target platform. I am looking into creating a docker build system to have a more platform agnostic publishing setup, but for now, this is all I have!

Any support or suggestions on this would be warmly welcomed.

### What about Flatpak or AppImage support?
I successfully created a Flatpak build, but ran into problems with `electron-forge` and configuring packages into it. I wanted to integrate git and npx into my flatpak build, but couldn't. Again, I'm hoping a Docker build system could resolve this issue... But if anyone has any support or suggestions on this, I'd be all ears!
