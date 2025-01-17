/*
 * Copyright (c) PIXILAB Technologies AB, Sweden (http://pixilab.se). All Rights Reserved.
 * Created 2017 by Mike Fahl.
 */


declare global {
	var $metaSupport$: {
		property(description ?: string, readOnly ?: boolean): any;
		callable(description ?: string): any;
		fieldMetadata(metadataValue: any): {
			(target: Function): void;
			(target: Object, targetKey: string | symbol): void;
		};
		callableParameter(cpd: ICallableParamDescr): any;
		record(description: string): any;
		spotParameter(): {
			(target: Object, targetKey: string | symbol): void;
		};
	}
}

// What's passed to $metaSupport$.callableParameter above
interface ICallableParamDescr {
	descr: string;
	opt: boolean;
}

/**
 Decorator defining a class acting as a device driver. This class must have a constructor
 that takes the baseDriverType of low-level driver to attach to. The driverMeta passed in
 is an object with keys/values that vary with the type of driver attached (see
 NetworkTCPDriverMetaData and NetworkUDPDriverMetaData in Network.ts for those driver
 types).

 Note to self: I must pass in baseDriverType as a string, since those are typically
 defined as interfaces (implemented in Java-land). So I can't get the param type
 using design:paramtypes since that then just says 'Object'.
 */
export function driver(baseDriverType: 'NetworkTCP'|'NetworkUDP', typeSpecificMeta: any) {
	const info: DriverInfo = {
		paramTypes: [baseDriverType],
		info: typeSpecificMeta
	};
	return function(target: any): void {
		return Reflect.defineMetadata("pixi:driver", info, target);
	}
}

// Implements the @record decorator, marking a class as a data store DTO
export function record(description?: string) {
	return $metaSupport$.record(description);
}

/**
 What I attach to my pixi:driver metadata key.
 */
interface DriverInfo {
	info: any;
	paramTypes: string[];
}

// Set of valid role identifiers
type RoleRequired = 'Admin'|'Manager'|'Creator'|'Editor'|'Contributor'|'Staff'|'Spot';

/**
 * Annotation for user script class, specifying role required to set properties exposed
 * by the script.
 */
export function roleRequired(role: RoleRequired) {
	return function(target: any): void {
		return Reflect.defineMetadata("pixi:roleRequired", role, target);
	}
}

/**
 Decorator declaring a property, for use on set or get function exposing
 the property's value.
 */
export function property(description?: string, readOnly?: boolean) {
	return $metaSupport$.property(description, readOnly); // Impl in $core
}

/**
 Decorator declaring a Task-callable method on a driver or user script,
 with optional description.
 */
export function callable(description?: string) {
	return $metaSupport$.callable(description); // Impl in $core
}

/**
 Optional callable method parameter decorator, providing a textual description of the parameter.
 Also allows trailing parameters to be marked as optional (typically used with
 '?' after the param name in the param list to also inform the compiler).
 */
export function parameter(description?: string, optional?: boolean) {
	return $metaSupport$.callableParameter({
		descr: description || "",
		opt: optional || false
	}); // Impl in $core
}


/**
 * Decorator for a feed or data-set field. Applied to an instance variable, which must
 * be of primitive type (i.e., string, number or boolean). Field values are exposed as
 * read-only properties.
 */
export function field(description?: string) {
	return $metaSupport$.fieldMetadata({description: description});
}


/**
 * Mark a field in specified Record as a Spot Parameter, making its value readable and
 * writable also as such.
 *
 * IMPORTANT: You must also add a parameter with the same name in the Spot's settings
 * for this to work. Merely marking it with @spotParameter() in the record definition
 * is not sufficient.
 */
export function spotParameter() {
	return $metaSupport$.spotParameter();
}

/**
 * Decorator for item ID field, if any. For feed script, only a single ID field
 * may be specified. A Record may use multiple ID fields, where each one can
 * be used to look up the Record instance. Typically of string or number type.
 * Read-only by definition (since it's used as lookup key).
 */
export function id(description?: string) {
	return $metaSupport$.fieldMetadata( {description: description, id: true} );
}

/**
 * Decorator specifying a list of feed item child elements of type T.
 * Apply to an instance variable of array type.
 */
export function list<T extends Object>(ofType: Ctor<T>, description?: string) {
	return $metaSupport$.fieldMetadata({description: description, list: ofType} );
}

/**
 Decorator defining a numeric value constraint, mainly for use on numeric properties and fields (although
 it could conceivably also be used on strings to define a min/max length, or similar).
 */
export function min(min:number) {
    return function (target: any, propertyKey: string) {
		Reflect.defineMetadata("pixi:min", min, target, propertyKey);
    };
}

export function max(max:number) {
    return function (target: any, propertyKey: string) {
		Reflect.defineMetadata("pixi:max", max, target, propertyKey);
    };
}

// Set of valid @resource HTTP methods
type ResourceVerb = 'GET'|'POST';


/**
Decorate a public script method with @resource() to make it callable using a
HTTP GET or POST request under a path that looks like this:

	/rest/script/invoke/<user-script-name>/<method-name>

For a POST request, a JSON body payload is expected. This will be parsed into
a Javscript object and passed as the method's first parameter. A GET request
carries no data beyond what's in the URL.

The method to which this decorator is applied must take an object as its
first parameter. This applies even if no data is actually passed to the
method (as in the case of a GET request).

The method may optionally accept a second parameter, which then receives the
trailing part of the URL (everything following <method-name>/), including any
query parameters. This is particularly useful for GET requests, where no
message body is included. Example:

	/rest/script/invoke/<user-script-name>/<method-name>/more-stuff?a=1&b=2

For this example, the second parameter to the method will receive the string
"more-stuff?a=1&b=2"

An object or string returned from the method will be serialized as JSON data
and returned to the caller. Alternatively, you may return a promise that will
eventually be rejected or resolved with the result.

The roleRequired parameter, if specified, limits who can call the resource from the
outside, and accepts the same values as the roleRequired decorator. Unless already
authenticated by other means, you must call such resources with a slightly
different URL, provoking authentication if not already done:

 	/rest/script/invoke-auth/<user-script-name>/<method-name>

 */
export function resource(
	roleRequired?: RoleRequired, // Authentication role required to call, or undefined
	verb?: ResourceVerb			// HTTP verb used in the request. Default is POST.
) {
	return function(target: any, propertyKey: string) {
		const info = {	// Information provided about this resource
			auth: roleRequired || '',
			verb: verb || 'POST'
		};
		return Reflect.defineMetadata("pixi:resource", info, target, propertyKey);
	}
}

