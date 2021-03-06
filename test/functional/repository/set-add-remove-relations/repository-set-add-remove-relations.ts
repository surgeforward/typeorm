import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {createTestingConnections, reloadTestingDatabases, closeTestingConnections} from "../../../utils/test-utils";

describe("repository > set/add/remove relation methods", function() {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("add elements to many-to-many from owner side", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);
        const postSpecificRepository = connection.getSpecificRepository(Post);

        // save a new category
        const newCategory1 = categoryRepository.create();
        newCategory1.name = "Animals";
        await categoryRepository.persist(newCategory1);

        // save a new category
        const newCategory2 = categoryRepository.create();
        newCategory2.name = "Kids";
        await categoryRepository.persist(newCategory2);

        // save a new post
        const newPost = postRepository.create();
        newPost.title = "Super post";
        await postRepository.persist(newPost);

        // add categories to a post
        await postSpecificRepository.addToRelation(post => post.manyCategories, newPost.id, [newCategory1.id, newCategory2.id]);

        // load a post, want to have categories count
        const loadedPost = await postRepository.findOneById(1, {
            join: {
                alias: "post",
                leftJoinAndSelect: {
                    manyCategories: "post.manyCategories"
                }
            }
        });

        expect(loadedPost!).not.to.be.empty;
        expect(loadedPost!.manyCategories).not.to.be.empty;
        expect(loadedPost!.manyCategories![0]).not.to.be.empty;
        expect(loadedPost!.manyCategories![1]).not.to.be.empty;

    })));

    it("add elements to many-to-many from inverse side", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);
        const categorySpecificRepository = connection.getSpecificRepository(Category);

        // save a new post
        const newPost1 = postRepository.create();
        newPost1.title = "post #1";
        await postRepository.persist(newPost1);

        // save a new post
        const newPost2 = postRepository.create();
        newPost2.title = "post #2";
        await postRepository.persist(newPost2);

        // save a new category
        const newCategory = categoryRepository.create();
        newCategory.name = "Kids";
        await categoryRepository.persist(newCategory);

        // add categories to a post
        await categorySpecificRepository.addToRelation(category => category.manyPosts, newCategory.id, [newPost1.id, newPost2.id]);

        // load a post, want to have categories count
        const loadedCategory = await categoryRepository.findOneById(1, {
            join: {
                alias: "category",
                leftJoinAndSelect: { manyPosts: "category.manyPosts" } }
            }
        );

        expect(loadedCategory).not.to.be.empty;
        expect(loadedCategory!.manyPosts).not.to.be.empty;
        expect(loadedCategory!.manyPosts![0]).not.to.be.empty;
        expect(loadedCategory!.manyPosts![1]).not.to.be.empty;
    })));

    it("remove elements to many-to-many from owner side", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);
        const postSpecificRepository = connection.getSpecificRepository(Post);

        // save a new category
        const newCategory1 = categoryRepository.create();
        newCategory1.name = "Animals";
        await categoryRepository.persist(newCategory1);

        // save a new category
        const newCategory2 = categoryRepository.create();
        newCategory2.name = "Kids";
        await categoryRepository.persist(newCategory2);

        // save a new category
        const newCategory3 = categoryRepository.create();
        newCategory3.name = "Adults";
        await categoryRepository.persist(newCategory3);

        // save a new post with categories
        const newPost = postRepository.create();
        newPost.title = "Super post";
        newPost.manyCategories = [newCategory1, newCategory2, newCategory3];
        await postRepository.persist(newPost);

        // add categories to a post
        await postSpecificRepository.removeFromRelation(post => post.manyCategories, newPost.id, [newCategory1.id, newCategory3.id]);

        // load a post, want to have categories count
        const loadedPost = await postRepository.findOneById(1, {
            join: {
                alias: "post",
                leftJoinAndSelect: { manyCategories: "post.manyCategories" }
            }
        });

        expect(loadedPost!).not.to.be.empty;
        expect(loadedPost!.manyCategories).not.to.be.empty;
        loadedPost!.manyCategories.length.should.be.equal(1);
        loadedPost!.manyCategories![0].name.should.be.equal("Kids");

    })));

    it("remove elements to many-to-many from inverse side", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);
        const categorySpecificRepository = connection.getSpecificRepository(Category);

        // save a new category
        const newPost1 = postRepository.create();
        newPost1.title = "post #1";
        await postRepository.persist(newPost1);

        // save a new category
        const newPost2 = postRepository.create();
        newPost2.title = "post #2";
        await postRepository.persist(newPost2);

        // save a new category
        const newPost3 = postRepository.create();
        newPost3.title = "post #3";
        await postRepository.persist(newPost3);

        // save a new post with categories
        const newCategory = categoryRepository.create();
        newCategory.name = "SuperCategory";
        newCategory.manyPosts = [newPost1, newPost2, newPost3];
        await categoryRepository.persist(newCategory);

        // add categories to a post
        await categorySpecificRepository.removeFromRelation(post => post.manyPosts, newCategory.id, [newPost1.id, newPost3.id]);

        // load a post, want to have categories count
        const loadedCategory = await categoryRepository.findOneById(1, {
            join: {
                alias: "category",
                leftJoinAndSelect: { manyPosts: "category.manyPosts" }
            }
        });

        expect(loadedCategory!).not.to.be.empty;
        expect(loadedCategory!.manyPosts).not.to.be.empty;
        loadedCategory!.manyPosts.length.should.be.equal(1);
        loadedCategory!.manyPosts[0].title.should.be.equal("post #2");
    })));

    it("set element to one-to-many relation", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);
        const postSpecificRepository = connection.getSpecificRepository(Post);
        const categorySpecificRepository = connection.getSpecificRepository(Category);

        // save a new category
        const newCategory1 = categoryRepository.create();
        newCategory1.name = "Animals";
        await categoryRepository.persist(newCategory1);

        // save a new post
        const newPost = postRepository.create();
        newPost.title = "Super post";
        await postRepository.persist(newPost);

        // add categories to a post
        await postSpecificRepository.setRelation(post => post.categories, newPost.id, newCategory1.id);

        // load a post, want to have categories count
        const loadedPost = await postRepository.findOneById(1, {
            join: {
                alias: "post",
                leftJoinAndSelect: { categories: "post.categories" }
            }
        });

        expect(loadedPost!).not.to.be.empty;
        expect(loadedPost!.categories).not.to.be.empty;
        expect(loadedPost!.categories![0]).not.to.be.empty;

    })));

    it("set element to many-to-one relation", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);
        const categorySpecificRepository = connection.getSpecificRepository(Category);

        // save a new category
        const newPost = postRepository.create();
        newPost.title = "post #1";
        await postRepository.persist(newPost);

        // save a new category
        const newCategory = categoryRepository.create();
        newCategory.name = "Kids";
        await categoryRepository.persist(newCategory);

        // add categories to a post
        await categorySpecificRepository.setRelation(category => category.post, newCategory.id, newPost.id);

        // load a post, want to have categories count
        const loadedCategory = await categoryRepository.findOneById(1, {
            join: {
                alias: "category",
                leftJoinAndSelect: { post: "category.post" }
            }
        });

        expect(loadedCategory!).not.to.be.empty;
        expect(loadedCategory!.post).not.to.be.empty;
    })));

    it("set element to NULL in one-to-many relation", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);
        const postSpecificRepository = connection.getSpecificRepository(Post);

        // save a new category
        const newCategory1 = categoryRepository.create();
        newCategory1.name = "Animals";
        await categoryRepository.persist(newCategory1);

        // save a new post
        const newPost = postRepository.create();
        newPost.title = "Super post";
        newPost.categories = [newCategory1];
        await postRepository.persist(newPost);

        // add categories to a post
        await postSpecificRepository.setRelation(post => post.categories, newPost.id, null);

        // load a post, want to have categories count
        const loadedPost = await postRepository.findOneById(1, {
            join: {
                alias: "post",
                leftJoinAndSelect: { categories: "post.categories" }
            }
        });

        expect(loadedPost!).not.to.be.empty;
        expect(loadedPost!.categories).to.be.empty;
    })));

    it("set element to NULL in many-to-one relation", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);
        const categorySpecificRepository = connection.getSpecificRepository(Category);

        // save a new category
        const newPost = postRepository.create();
        newPost.title = "post #1";
        await postRepository.persist(newPost);

        // save a new category
        const newCategory = categoryRepository.create();
        newCategory.name = "Kids";
        newCategory.post = newPost;
        await categoryRepository.persist(newCategory);

        // add categories to a post
        await categorySpecificRepository.setRelation(category => category.post, newCategory.id, null);

        // load a post, want to have categories count
        const loadedCategory = await categoryRepository.findOneById(1, {
            join: {
                alias: "category",
                leftJoinAndSelect: { post: "category.post" }
            }
        });

        expect(loadedCategory).not.to.be.empty;
        expect(loadedCategory!.post).to.be.empty;

    })));

});
